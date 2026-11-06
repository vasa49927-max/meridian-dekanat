// npm run db:seed — пересоздать демо-данные. Запуск: node --env-file=.env --conditions=react-server --import tsx scripts/seed.ts
import { db } from "@/server/db";
import { seedDemo } from "@/server/seed/seed";

const t = Date.now();
await seedDemo(db, { log: (m) => console.log("✓", m) });
console.log(`Готово за ${((Date.now() - t) / 1000).toFixed(1)} с`);
process.exit(0);
