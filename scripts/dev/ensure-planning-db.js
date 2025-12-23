/**
 * Ensures the Planning Service database exists when running services locally
 * without Docker Compose.
 *
 * Usage:
 *   node scripts/dev/ensure-planning-db.js
 *
 * Env overrides:
 *   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE (defaults to postgres)
 *   PLANNING_DB_NAME (defaults to hockey_hub_planning)
 */
const { Client } = require("pg");

async function main() {
  const host = process.env.PGHOST || "localhost";
  const port = Number(process.env.PGPORT || "5432");
  const user = process.env.PGUSER || "postgres";
  const password = process.env.PGPASSWORD || "hockey_hub_password";
  const adminDb = process.env.PGDATABASE || "postgres";
  const planningDb = process.env.PLANNING_DB_NAME || "hockey_hub_planning";

  const c = new Client({ host, port, user, password, database: adminDb });
  await c.connect();

  const exists = await c.query("select 1 from pg_database where datname = $1", [
    planningDb,
  ]);
  if (exists.rowCount > 0) {
    console.log(`[planning-db] exists: ${planningDb}`);
    await c.end();
    return;
  }

  await c.query(`create database "${planningDb}"`);
  console.log(`[planning-db] created: ${planningDb}`);
  await c.end();
}

main().catch((e) => {
  console.error("[planning-db] failed:", e?.message || e);
  process.exit(1);
});





