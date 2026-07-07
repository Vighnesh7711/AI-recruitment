const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://vighneshgawande_db_user:TO6OL8A3HOiSHYXm@cluster0.hu1fhvc.mongodb.net/?appName=Cluster0';

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const qRespCol = mongoose.connection.db.collection('question_responses');
    
    // Find all question responses
    const allResponses = await qRespCol.find().toArray();
    console.log(`Total question response records: ${allResponses.length}`);

    // Map to track seen (interviewId + questionOrder)
    const seen = new Set();
    let deleteCount = 0;

    for (const qr of allResponses) {
      const key = `${qr.interviewId.toString()}_${qr.questionOrder}`;
      if (seen.has(key)) {
        // Delete this duplicate
        await qRespCol.deleteOne({ _id: qr._id });
        console.log(`Deleted duplicate: Q${qr.questionOrder} (id=${qr._id}) for interview ${qr.interviewId}`);
        deleteCount++;
      } else {
        seen.add(key);
      }
    }

    console.log(`Cleanup complete. Deleted ${deleteCount} duplicate records.`);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error during cleanup:', err);
  }
}

cleanup();
