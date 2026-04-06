import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

try {
  // List all tables
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  );
  console.log(
    "Tables:",
    tables.rows.map((r) => r.name),
  );

  // Check postcards table schema
  const schema = await client.execute("PRAGMA table_info(postcards)");
  console.log(
    "\nPostcards columns:",
    schema.rows.map((r) => `${r.name} (${r.type})`),
  );

  // Count rows
  const count = await client.execute("SELECT COUNT(*) as cnt FROM postcards");
  console.log("\nPostcards row count:", count.rows[0].cnt);

  console.log("\n✅ DB connection works!");
} catch (err) {
  console.error("❌ DB error:", err.message);
}
