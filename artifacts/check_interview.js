const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    // Get last interview
    const interviewCol = mongoose.connection.db.collection('interviews');
    const lastInterview = await interviewCol.find().sort({ createdAt: -1 }).limit(1).next();
    console.log('Last Interview:', lastInterview);

    if (lastInterview) {
      const qRespCol = mongoose.connection.db.collection('question_responses');
      const qResps = await qRespCol.find({ interviewId: lastInterview._id }).sort({ questionOrder: 1 }).toArray();
      console.log(`Found ${qResps.length} question responses for interview ${lastInterview._id}:`);
      qResps.forEach(qr => {
        console.log(`  Q${qr.questionOrder}: id=${qr._id}, questionId=${qr.questionId}, answer="${qr.answer}", score=${qr.aiScore}`);
      });
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
