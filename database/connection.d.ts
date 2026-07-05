import mongoose from 'mongoose';
/**
 * Connect to MongoDB Atlas with exponential backoff retry logic.
 * Reads MONGODB_URI from the server/.env file.
 * Retries up to 5 times on failure, with delays of 1s, 2s, 4s, 8s, 16s.
 */
export declare function connectDB(): Promise<typeof mongoose>;
export default connectDB;
//# sourceMappingURL=connection.d.ts.map
