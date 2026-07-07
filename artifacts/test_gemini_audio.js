const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const silentWebmBase64 = 'GkXfo6NgoSZjtQ7gQ52gA5aiwQIiDA0fDA0fggE7AIwDA0FCQ0ZESGFHQ0ZECaGDgYEB44OEg8CQc3Vwc3V4g4ODg4OSg8CQc3Vwc3V4g4ODg4OSg8CEg4OEhPCQc3Vwc3V4g4ODg4OSg8CEg4OEhPCQc3Vwc3V4g4ODg4OSg8CA';

async function testAudio() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    console.log('Sending audio request to Gemini...');
    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/webm',
                  data: silentWebmBase64,
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
      }
    );
    console.log('Gemini Audio Response:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('Gemini Audio Request Failed:');
    console.error(err);
  }
}

testAudio();
