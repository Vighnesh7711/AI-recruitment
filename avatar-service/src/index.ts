import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';
import FormData from 'form-data';

dotenv.config();

const execPromise = util.promisify(exec);
const app = express();
const PORT = process.env.PORT || 5002;

// ── Middleware ──
app.use(
  cors({
    origin: [process.env.CLIENT_URL, 'http://localhost:5173'].filter(Boolean) as string[],
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(morgan('dev'));

// ── Session State Management ──
interface Action {
  type: 'speak' | 'listen';
  questionText?: string;
  audio?: string;
  lipsync?: {
    metadata: { soundFile: string; duration: number };
    mouthCues: Array<{ start: number; end: number; value: string }>;
  };
}

interface Session {
  sessionId: string;
  interviewId: string;
  actions: Action[];
}

const sessions = new Map<string, Session>();
const listenResolvers = new Map<string, (audioBase64: string) => void>();
// Buffers audio that arrived via /respond BEFORE the server called /avatar/listen.
// The client posts its recording to /respond first, then triggers /answer (which
// calls /avatar/listen), so without this buffer the audio would be dropped and
// every voice answer would time out. Keyed by sessionId.
const pendingResponses = new Map<string, string>();

// A short base64 encoded silent 1-second MP3 to use as a fallback audio block.
const silentMp3Base64 =
  'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGFtZTMuMTAwYnVpbGQfAAAAAAAAAAD/lhAAMAAAb0ACAAYAAA//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACAAACAAAAAP/uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACAAACAAAAAP/uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACAAACAAAAAP/uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACAAAAAP/';

// Generate simulated mouth cues for lipsync animation
function generateSimulatedCues(text: string, durationSeconds: number) {
  const mouthShapes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'X'];
  const cues = [];
  const cueCount = Math.floor(durationSeconds * 10); // 10 cues per second
  let start = 0;
  for (let i = 0; i < cueCount; i++) {
    const end = Number((start + 0.1).toFixed(2));
    const value =
      i === cueCount - 1 ? 'X' : mouthShapes[Math.floor(Math.random() * (mouthShapes.length - 1))];
    cues.push({ start, end, value });
    start = end;
  }
  return cues;
}

// Convert a base64 WebM/Opus recording to base64 WAV (16kHz mono PCM) using
// ffmpeg. Returns null if ffmpeg is unavailable or the conversion fails, so the
// caller can fall back to the original audio bytes.
async function convertWebmToWav(webmBase64: string, sessionId: string): Promise<string | null> {
  const tempDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  const id = `${sessionId}_${Math.random().toString(36).substr(2, 6)}`;
  const webmPath = path.join(tempDir, `in_${id}.webm`);
  const wavPath = path.join(tempDir, `out_${id}.wav`);

  try {
    fs.writeFileSync(webmPath, Buffer.from(webmBase64, 'base64'));
    // -ar 16000 -ac 1 → 16kHz mono, the format speech models expect.
    await execPromise(`ffmpeg -y -i "${webmPath}" -ar 16000 -ac 1 "${wavPath}"`);
    if (fs.existsSync(wavPath)) {
      const wavBuffer = fs.readFileSync(wavPath);
      return wavBuffer.toString('base64');
    }
    return null;
  } catch (err: any) {
    console.warn(
      `[avatar-service] webm→wav conversion failed, using original audio: ${err.message}`
    );
    return null;
  } finally {
    [webmPath, wavPath].forEach((p) => {
      if (fs.existsSync(p)) {
        try {
          fs.unlinkSync(p);
        } catch (e) {
          /* ignore */
        }
      }
    });
  }
}

// Convert MP3 to WAV and run Rhubarb Lip Sync CLI
async function runRhubarbOrSimulate(audioBuffer: Buffer, text: string, duration: number) {
  const tempDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  const id = Math.random().toString(36).substr(2, 9);
  const mp3Path = path.join(tempDir, `message_${id}.mp3`);
  const wavPath = path.join(tempDir, `message_${id}.wav`);
  const jsonPath = path.join(tempDir, `message_${id}.json`);

  try {
    fs.writeFileSync(mp3Path, audioBuffer);

    // Convert to wav using ffmpeg
    await execPromise(`ffmpeg -y -i "${mp3Path}" "${wavPath}"`);

    // Check if rhubarb binary exists in vendor repo's bin or is globally available
    const binPath = path.resolve(
      process.cwd(),
      'vendor/talking-avatar-with-ai/apps/backend/bin/rhubarb.exe'
    );
    const rhubarbCmd = fs.existsSync(binPath) ? `"${binPath}"` : 'rhubarb';

    await execPromise(`${rhubarbCmd} -f json -o "${jsonPath}" "${wavPath}" -r phonetic`);

    if (fs.existsSync(jsonPath)) {
      const data = fs.readFileSync(jsonPath, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.mouthCues || [];
    }
  } catch (err) {
    console.warn('[Rhubarb] Failed to run rhubarb executable. Falling back to simulation:', err);
  } finally {
    // clean up files
    [mp3Path, wavPath, jsonPath].forEach((p) => {
      if (fs.existsSync(p)) {
        try {
          fs.unlinkSync(p);
        } catch (e) {
          /* ignore */
        }
      }
    });
  }

  return generateSimulatedCues(text, duration);
}

// ── Health Check ──
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'avatar-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── API Wrapper Routes ──

// POST /avatar/session/start
app.post('/avatar/session/start', (req: Request, res: Response) => {
  const { interviewId } = req.body;
  if (!interviewId) {
    res.status(400).json({ error: 'interviewId is required' });
    return;
  }
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessions.set(sessionId, {
    sessionId,
    interviewId,
    actions: [],
  });
  res.json({ sessionId });
});

// POST /avatar/ask
app.post('/avatar/ask', async (req: Request, res: Response) => {
  const { sessionId, questionText } = req.body;
  if (!sessionId || !questionText) {
    res.status(400).json({ error: 'sessionId and questionText are required' });
    return;
  }
  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  try {
    let audioBase64 = '';
    let mouthCues: any[] = [];
    let duration = 3.0;

    const xiKey = process.env.ELEVEN_LABS_API_KEY;
    const voiceId = process.env.ELEVEN_LABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel/Jack default

    if (xiKey && xiKey !== '-') {
      try {
        const ttsResponse = await axios.post(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            text: questionText,
            model_id: process.env.ELEVEN_LABS_MODEL_ID || 'eleven_monolingual_v1',
            voice_settings: { stability: 0.5, similarity_boost: 0.5 },
          },
          {
            headers: { 'xi-api-key': xiKey, 'Content-Type': 'application/json' },
            responseType: 'arraybuffer',
          }
        );
        const audioBuffer = Buffer.from(ttsResponse.data);
        audioBase64 = audioBuffer.toString('base64');
        duration = audioBuffer.length / 16000;
        if (duration < 1.0) duration = 1.0;

        mouthCues = await runRhubarbOrSimulate(audioBuffer, questionText, duration);
      } catch (err: any) {
        console.error('ElevenLabs/Rhubarb failed, using simulation:', err.message);
        audioBase64 = silentMp3Base64;
        duration = Math.max(3.0, questionText.length * 0.08);
        mouthCues = generateSimulatedCues(questionText, duration);
      }
    } else {
      audioBase64 = silentMp3Base64;
      duration = Math.max(3.0, questionText.length * 0.08);
      mouthCues = generateSimulatedCues(questionText, duration);
    }

    session.actions.push({
      type: 'speak',
      questionText,
      audio: audioBase64,
      lipsync: {
        metadata: { soundFile: 'message.wav', duration },
        mouthCues,
      },
    });

    res.json({ status: 'speaking' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process ask', details: err.message });
  }
});

// POST /avatar/listen
app.post('/avatar/listen', async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    res.status(400).json({ error: 'sessionId is required' });
    return;
  }
  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  // NOTE: we intentionally do NOT push a { type: 'listen' } action here.
  // The client transitions to its recording UI on its own once the spoken
  // question audio ends. Queuing a stray 'listen' would be shifted off ahead
  // of the next question's 'speak' action and silence the avatar from Q2 on.

  // Wait for the client response (or use audio already buffered via /respond)
  try {
    const audioBase64 = await new Promise<string>((resolve, reject) => {
      // If the client already posted its recording to /respond before we got
      // here, consume the buffered audio immediately instead of waiting.
      const buffered = pendingResponses.get(sessionId);
      if (buffered) {
        pendingResponses.delete(sessionId);
        resolve(buffered);
        return;
      }

      const timeout = setTimeout(() => {
        listenResolvers.delete(sessionId);
        reject(new Error('Microphone response timeout'));
      }, 60000);

      listenResolvers.set(sessionId, (audio: string) => {
        clearTimeout(timeout);
        resolve(audio);
      });
    });

    // Transcribe audio using Gemini, then Whisper as a fallback.
    let transcript = '';
    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    // The browser records WebM/Opus. Convert it to WAV (16kHz mono) via ffmpeg so
    // speech-to-text models receive a widely-supported PCM format — this noticeably
    // improves transcription reliability. If conversion fails we fall back to the
    // original WebM bytes so we still attempt a transcription.
    let geminiMime = 'audio/webm';
    let geminiData = audioBase64;
    const converted = await convertWebmToWav(audioBase64, sessionId);
    if (converted) {
      geminiMime = 'audio/wav';
      geminiData = converted;
    }

    if (geminiKey && geminiKey !== '-') {
      const retries = 5;
      let delay = 3000;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

      for (let i = 0; i < retries; i++) {
        try {
          console.log(
            `[avatar-service] Transcribing audio for session ${sessionId} using Gemini 2.5 Flash (Attempt ${i + 1}/${retries})...`
          );
          const response = await axios.post(
            url,
            {
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: geminiMime,
                        data: geminiData,
                      },
                    },
                    {
                      text: 'Transcribe the audio accurately into English text. Return ONLY the transcription text, with no preamble, formatting, or extra commentary. If there is no audible speech or only noise/silence, return "No response recorded.".',
                    },
                  ],
                },
              ],
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 30000,
            }
          );

          const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          transcript = text.trim();
          console.log(`[avatar-service] Gemini transcription success: "${transcript}"`);
          break;
        } catch (err: any) {
          const status = err.response?.status;
          if (status === 429 && i < retries - 1) {
            console.warn(`[avatar-service] Gemini rate limit (429) hit. Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
          } else {
            console.error(
              '[avatar-service] Gemini transcription failed:',
              err.response?.data || err.message
            );
            break;
          }
        }
      }
    }

    // Fallback to Whisper if Gemini failed or wasn't configured
    if (!transcript && openAiKey && openAiKey !== '-') {
      try {
        console.log(
          `[avatar-service] Transcribing audio for session ${sessionId} using Whisper...`
        );
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        const tempDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir);
        }
        const tempPath = path.join(tempDir, `audio_${sessionId}.webm`);
        fs.writeFileSync(tempPath, audioBuffer);

        const formData = new FormData();
        formData.append('file', fs.createReadStream(tempPath), 'audio.webm');
        formData.append('model', 'whisper-1');

        const whisperResponse = await axios.post(
          'https://api.openai.com/v1/audio/transcriptions',
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              Authorization: `Bearer ${openAiKey}`,
            },
            timeout: 30000,
          }
        );

        transcript = whisperResponse.data.text || '';
        console.log(`[avatar-service] Whisper transcription success: "${transcript}"`);
        try {
          fs.unlinkSync(tempPath);
        } catch (e) {
          /* ignore */
        }
      } catch (err: any) {
        console.error('[avatar-service] Whisper transcription failed:', err.message);
      }
    }

    // Honest failure — do NOT fabricate an answer. If transcription genuinely
    // failed, return an empty transcript with a flag so the server/UI can reflect
    // that no answer was captured instead of scoring a fake response.
    const normalized = transcript.trim();
    if (!normalized || normalized.toLowerCase() === 'no response recorded.') {
      console.warn('[avatar-service] Transcription produced no usable text.');
      res.json({ transcript: '', transcriptionFailed: true });
      return;
    }

    res.json({ transcript: normalized, transcriptionFailed: false });
  } catch (err: any) {
    res.status(504).json({ error: err.message || 'Gateway Timeout waiting for voice response' });
  }
});

// POST /avatar/session/end
app.post('/avatar/session/end', (req: Request, res: Response) => {
  const { sessionId } = req.body;
  if (sessionId) {
    sessions.delete(sessionId);
    listenResolvers.delete(sessionId);
    pendingResponses.delete(sessionId);
  }
  res.json({ status: 'ended' });
});

// ── Client-Broker Bridge Endpoints ──

// GET /avatar/session/:sessionId/next-action
app.get('/avatar/session/:sessionId/next-action', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }
  if (session.actions.length > 0) {
    const action = session.actions.shift();
    res.json(action);
  } else {
    res.json({ type: 'idle' });
  }
});

// POST /avatar/session/:sessionId/respond
app.post('/avatar/session/:sessionId/respond', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const { audio } = req.body;
  if (!audio) {
    res.status(400).json({ error: 'audio base64 is required' });
    return;
  }
  const resolver = listenResolvers.get(sessionId);
  if (resolver) {
    // A /avatar/listen call is already waiting — hand the audio over directly.
    resolver(audio);
    listenResolvers.delete(sessionId);
    res.json({ status: 'received' });
  } else {
    // The listen request hasn't started yet (client posts audio before /answer
    // triggers /avatar/listen). Buffer it so /avatar/listen can pick it up.
    pendingResponses.set(sessionId, audio);
    res.json({ status: 'buffered' });
  }
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`[avatar-service] Running on http://localhost:${PORT}`);
  console.log(`[avatar-service] Health: http://localhost:${PORT}/health`);
});

export default app;
