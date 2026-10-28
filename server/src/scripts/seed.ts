// npm run seed            → fills an empty database with demo data
// npm run seed -- --reset → wipes users, creators and campaigns first
import { connectDb, disconnectDb } from '../db/connect';
import { DEMO_ADMIN, seedDemoData } from '../db/seed';

async function main() {
  await connectDb();
  const seeded = await seedDemoData({ reset: process.argv.includes('--reset') });
  console.log(
    seeded
      ? `Demo data created. Log in as ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}`
      : 'The database already has users; nothing to do (use --reset to start over).',
  );
  await disconnectDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
