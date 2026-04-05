import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  url: text("url").notNull().unique(),
  platform: text("platform"),
  markdown: text("markdown"),
  username: text("username"),
  timestampText: text("timestamp_text"),
  mainText: text("main_text"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export const postcards = sqliteTable("postcards", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id),
  url: text("url").notNull(),
  platform: text("platform"),
  postcardScore: real("postcard_score").notNull(),
  originScore: real("origin_score"),
  corroborationScore: real("corroboration_score"),
  biasScore: real("bias_score"),
  temporalScore: real("temporal_score"),
  verdict: text("verdict"),
  summary: text("summary"),
  confidenceScore: real("confidence_score"),
  primarySources: text("primary_sources"),
  queriesExecuted: text("queries_executed"),
  corroborationLog: text("corroboration_log"),
  auditLog: text("audit_log"),
  hits: integer("hits").notNull().default(0),
  status: text("status").notNull().default("pending"),
  progress: real("progress"),
  stage: text("stage"),
  message: text("message"),
  error: text("error"),
  startedAt: integer("started_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export type PostRow = typeof posts.$inferSelect;
export type NewPostRow = typeof posts.$inferInsert;
export type PostcardRow = typeof postcards.$inferSelect;
export type NewPostcardRow = typeof postcards.$inferInsert;
