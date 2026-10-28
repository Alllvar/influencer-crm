import { env } from './config/env';
import { createApp } from './app';
import { connectDb, disconnectDb } from './db/connect';
import { DEMO_ADMIN, seedDemoData } from './db/seed';

async function main() {
  const { inMemory } = await connectDb();

  // The in-memory database starts empty on every run, and a public demo needs data too.
  if (inMemory || env.SEED_DEMO) {
    if (await seedDemoData()) console.log(`Demo data created. Log in as ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}`);
  }

  const server = createApp().listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT} (docs: /api/docs)`);
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
