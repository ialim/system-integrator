/**
 * Simple SQL migration runner.
 * Looks for .sql files in ./migrations and applies them in order once.
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "pg";

function buildPgConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || "app",
    password: process.env.DB_PASSWORD || "app",
    database: process.env.DB_NAME || "app"
  };
}

async function run() {
  const pool = new Pool(buildPgConfig());
  const client = await pool.connect();
  const migrationsDir = resolve(process.cwd(), "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      run_at TIMESTAMP DEFAULT NOW()
    );
  `);

  for (const file of files) {
    const exists = await client.query("SELECT 1 FROM migrations WHERE name = $1", [file]);
    if (exists.rowCount) {
      continue;
    }
    const sql = readFileSync(resolve(migrationsDir, file), "utf8");
    console.log(`Applying migration ${file}...`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`Migration ${file} applied`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Migration ${file} failed`, err);
      throw err;
    }
  }

  client.release();
  await pool.end();
}

run().catch((err) => {
  console.error("Migration runner failed:", err);
  process.exit(1);
});
