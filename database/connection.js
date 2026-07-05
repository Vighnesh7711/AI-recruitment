'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require('mongoose'));
const dotenv_1 = __importDefault(require('dotenv'));
const path_1 = __importDefault(require('path'));
const logger_1 = __importDefault(require('../server/src/lib/logger'));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../server/.env') });
const MONGODB_URI = process.env.MONGODB_URI;
const MAX_RETRIES = 5;
/**
 * Connect to MongoDB Atlas with exponential backoff retry logic.
 * Reads MONGODB_URI from the server/.env file.
 * Retries up to 5 times on failure, with delays of 1s, 2s, 4s, 8s, 16s.
 */
async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }
  // Log connection state changes
  mongoose_1.default.connection.on('connected', () => {
    logger_1.default.info('Mongoose connection established');
  });
  mongoose_1.default.connection.on('disconnected', () => {
    logger_1.default.warn('Mongoose connection disconnected');
  });
  mongoose_1.default.connection.on('error', (err) => {
    logger_1.default.error('Mongoose connection error', err);
  });
  mongoose_1.default.connection.on('reconnected', () => {
    logger_1.default.info('Mongoose connection reconnected');
  });
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger_1.default.info(`MongoDB connection attempt ${attempt}/${MAX_RETRIES}...`);
      const conn = await mongoose_1.default.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      logger_1.default.info(`MongoDB connected successfully: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, 8s, 16s
      if (attempt < MAX_RETRIES) {
        logger_1.default.warn(
          `MongoDB connection attempt ${attempt} failed. Retrying in ${delay / 1000}s...`,
          { error: err.message }
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger_1.default.error(`MongoDB connection failed after ${MAX_RETRIES} attempts`, err);
        throw err;
      }
    }
  }
  // TypeScript: unreachable, but satisfies return type
  throw new Error('connectDB: unreachable');
}
exports.default = connectDB;
//# sourceMappingURL=connection.js.map
