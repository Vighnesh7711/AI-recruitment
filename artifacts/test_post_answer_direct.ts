import { connectDB } from '../database/connection';
import { Interview, QuestionResponse, User } from '../database';
import mongoose from 'mongoose';

async function run() {
  console.log('Connecting to DB...');
  await connectDB();

  const user = await User.findOne({ email: 'vighneshg2004@gmail.com' });
  console.log(`User ID: ${user?._id}`);

  const interview = await Interview.findOne().sort({ createdAt: -1 });
  if (!interview) {
    console.error('No interview.');
    await mongoose.disconnect();
    return;
  }
  console.log(`Interview ID: ${interview._id}, status: ${interview.status}`);

  const allQ = await QuestionResponse.find({ interviewId: interview._id }).sort({ questionOrder: 1 });
  console.log(`Found ${allQ.length} question responses:`);
  for (const q of allQ) {
    console.log(`- Order: ${q.questionOrder}, ID: ${q._id}, Answer: "${q.answer}", Score: ${q.aiScore}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
