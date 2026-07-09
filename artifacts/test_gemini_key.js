const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const geminiKey = process.env.GEMINI_API_KEY;

async function test() {
  if (!geminiKey) {
    console.error('No GEMINI_API_KEY found');
    return;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
  try {
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: 'Hello' }] }],
    });
    console.log('Success! Response:', response.data?.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (err) {
    console.error('Failed! Status:', err.response?.status);
    console.error('Error Details:', err.response?.data || err.message);
  }
}

test();
