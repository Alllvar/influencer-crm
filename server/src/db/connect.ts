import mongoose from 'mongoose';
import { env } from '../config/env';

let memoryServer: { stop: () => Promise<boolean> } | undefined;

// Connects to MONGODB_URI. Without it (local development only) it starts a temporary
// in-memory MongoDB, so the project runs without installing anything. Data is lost on restart.
export async function connectDb(): Promise<{ inMemory: boolean }> {
  let uri = env.MONGODB_URI;

  if (!uri) {
    if (env.NODE_ENV === 'production') throw new Error('MONGODB_URI is required in production');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const server = await MongoMemoryServer.create();
    memoryServer = server;
    uri = server.getUri();
    console.log('MONGODB_URI is empty: using a temporary in-memory MongoDB');
  }

  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  return { inMemory: Boolean(memoryServer) };
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
  await memoryServer?.stop();
}
