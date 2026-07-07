const axios = require('axios');

// A tiny silent webm base64 audio (about 1 second of silence)
const silentWebmBase64 = 'GkXfo6NgoSZjtQ7gQ52gA5aiwQIiDA0fDA0fggE7AIwDA0FCQ0ZESGFHQ0ZECaGDgYEB44OEg8CQc3Vwc3V4g4ODg4OSg8CQc3Vwc3V4g4ODg4OSg8CEg4OEhPCQc3Vwc3V4g4ODg4OSg8CEg4OEhPCQc3Vwc3V4g4ODg4OSg8CA';

async function runTest() {
  try {
    const sessionRes = await axios.post('http://localhost:5002/avatar/session/start', {
      interviewId: '6a4b9494cd4254f7f9a662c6'
    });
    const sessionId = sessionRes.data.sessionId;
    console.log('Started session:', sessionId);

    console.log('Sending audio to /respond...');
    const respondRes = await axios.post(`http://localhost:5002/avatar/session/${sessionId}/respond`, {
      audio: silentWebmBase64
    });
    console.log('Respond status:', respondRes.data.status);

    console.log('Calling /listen...');
    const listenRes = await axios.post('http://localhost:5002/avatar/listen', {
      sessionId
    });
    console.log('Listen response:', JSON.stringify(listenRes.data, null, 2));

  } catch (err) {
    console.error('Test failed:', err.response ? err.response.data : err.message);
  }
}

runTest();
