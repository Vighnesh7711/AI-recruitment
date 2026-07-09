const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const hasInterviews = collections.some((col) => col.name === 'interviews');

    if (hasInterviews) {
      console.log('Interviews collection found. Listing indexes...');
      const indexes = await db.collection('interviews').indexes();
      console.log('Current indexes:', indexes);

      const hasTokenIndex = indexes.some((idx) => idx.name === 'token_1');
      if (hasTokenIndex) {
        console.log('Dropping index token_1...');
        await db.collection('interviews').dropIndex('token_1');
        console.log('Index token_1 successfully dropped!');
      } else {
        console.log('Index token_1 not found on interviews collection.');
      }
    } else {
      console.log('interviews collection not found.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
