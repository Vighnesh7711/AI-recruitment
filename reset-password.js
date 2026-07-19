const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const hash = await bcrypt.hash('password123', 10);
  const result = await mongoose.connection.db.collection('users').updateOne(
    { email: 'aakankshabhope76@gmail.com' },
    { $set: { passwordHash: hash } }
  );
  console.log('Updated:', result.modifiedCount, 'document(s)');
  console.log('New password for aakankshabhope76@gmail.com: password123');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
