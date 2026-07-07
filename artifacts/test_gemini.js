const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function test() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    console.log('Sending request to Gemini...');
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: 'Hello, reply with "API is working"' }] }]
    });
    console.log('Gemini Response:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('Gemini Request Failed:', err.response ? err.response.data : err.message);
  }
}

test();
