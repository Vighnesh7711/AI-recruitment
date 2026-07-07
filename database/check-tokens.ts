import { User } from './User';
import { connectDB } from './connection';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

async function run() {
  try {
    await connectDB();
    const users = await User.find({ isVerified: false }).sort({ createdAt: -1 }).limit(5);
    if (users.length === 0) {
      console.log('\nNo unverified users found.');
    } else {
      console.log('\n--- PENDING USER VERIFICATIONS (Latest 5) ---');
      for (const u of users) {
        console.log(`\nEmail: ${u.email}`);
        console.log(`Token: ${u.verificationToken}`);
        console.log(`Link:  http://localhost:5173/verify-email?token=${u.verificationToken}`);
      }
    }
  } catch (err: any) {
    console.error('Error fetching tokens:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
