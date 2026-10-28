import { env } from './config/env';
import { createApp } from './app';
import { connectDb, disconnectDb } from './db/connect';

async function main() {
  await connectDb();
  const server = createApp().listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });

  // Close connections cleanly on Ctrl+C or when the hosting platform stops the app.
  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close();
    await disconnectDb();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
