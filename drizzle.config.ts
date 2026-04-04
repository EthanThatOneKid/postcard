import { defineConfig } from "drizzle-kit";

const dbUrl = process.env.TURSO_DATABASE_URL || "file:local.db";
const dbCredentials: { url: string; authToken?: string } = { url: dbUrl };
if (dbUrl.startsWith("libsql://")) {
  dbCredentials.authToken = process.env.TURSO_AUTH_TOKEN;
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials,
});
