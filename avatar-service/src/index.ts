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
    const value = i === cueCount - 1 ? 'X' : mouthShapes[Math.floor(Math.random() * (mouthShapes.length - 1))];
    cues.push({ start, end, value });
    start = end;
  }
  return cues;
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
        try { fs.unlinkSync(p); } catch {}
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

  // Push 'listen' action to the queue so the client knows it should record
  session.actions.push({ type: 'listen' });

  // Wait for the client response
  try {
    const audioBase64 = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        listenResolvers.delete(sessionId);
        reject(new Error('Microphone response timeout'));
      }, 60000);

      listenResolvers.set(sessionId, (audio: string) => {
        clearTimeout(timeout);
        resolve(audio);
      });
    });

    // Transcribe audio using Whisper
    let transcript = '';
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey && openAiKey !== '-') {
      try {
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
          }
        );

        transcript = whisperResponse.data.text || '';
        try { fs.unlinkSync(tempPath); } catch {}
      } catch (err: any) {
        console.error('Whisper transcription failed, using mock:', err.message);
        transcript = "Sample response about key technical achievements and React application design.";
      }
    } else {
      transcript = "Sample response about key technical achievements and React application design.";
    }

    res.json({ transcript });
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
    resolver(audio);
    listenResolvers.delete(sessionId);
    res.json({ status: 'received' });
  } else {
    res.status(400).json({ error: 'No active listen request for this session' });
  }
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`[avatar-service] Running on http://localhost:${PORT}`);
  console.log(`[avatar-service] Health: http://localhost:${PORT}/health`);
});

export default app;
