import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import logger from '../server/src/lib/logger';

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const MAX_RETRIES = 5;

/**
 * Connect to MongoDB Atlas with exponential backoff retry logic.
 * Reads MONGODB_URI from the server/.env file.
 * Retries up to 5 times on failure, with delays of 1s, 2s, 4s, 8s, 16s.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  // Log connection state changes
  mongoose.connection.on('connected', () => {
    logger.info('Mongoose connection established');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose connection disconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('Mongoose connection error', err);
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('Mongoose connection reconnected');
  });

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`MongoDB connection attempt ${attempt}/${MAX_RETRIES}...`);
      const conn = await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      logger.info(`MongoDB connected successfully: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, 8s, 16s
      if (attempt < MAX_RETRIES) {
        logger.warn(
          `MongoDB connection attempt ${attempt} failed. Retrying in ${delay / 1000}s...`,
          { error: (err as Error).message }
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.error(`MongoDB connection failed after ${MAX_RETRIES} attempts`, err as Error);
        throw err;
      }
    }
  }

  // TypeScript: unreachable, but satisfies return type
  throw new Error('connectDB: unreachable');
}

export default connectDB;
