import {
  type PostcardReport,
  type Postcard,
  PostcardReportSchema,
  PostcardSchema,
} from "./schemas";
import type { PostRow, PostcardRow } from "../db/schema";

/**
 * Converts a database PostRow to a Postcard domain object for trace agents.
 */
export function postRowToPostcard(post: PostRow): Postcard {
  return PostcardSchema.parse({
    platform: post.platform || "Other",
    username: post.username || undefined,
    timestampText: post.timestampText || undefined,
    mainText: post.mainText || "",
  });
}

/**
 * Converts a database PostcardRow + PostRow pair to a full PostcardReport.
 * Handles all JSON parsing and schema mapping in one place.
 */
export function dbRowToReport(row: PostcardRow, post: PostRow): PostcardReport {
  const queriesExecuted = JSON.parse(row.queriesExecuted || "[]");

  return PostcardReportSchema.parse({
    postcard: {
      platform: row.platform || post.platform || "Other",
      mainText: post.mainText || "",
      username: post.username || undefined,
      timestampText: post.timestampText || undefined,
    },
    markdown: post.markdown || "",
    triangulation: {
      targetUrl: row.url,
      queries: queriesExecuted.map((q: { query: string }) => q.query),
    },
    audit: {
      originScore: row.originScore ?? 0,
      temporalScore: row.temporalScore ?? 0,
      totalScore: row.postcardScore / 100, // DB stores 0-100, app uses 0.0-1.0
      auditLog: JSON.parse(row.auditLog || "[]"),
    },
    corroboration: {
      primarySources: JSON.parse(row.primarySources || "[]"),
      queriesExecuted,
      verdict: (row.verdict ||
        "insufficient_data") as PostcardReport["corroboration"]["verdict"],
      summary: row.summary ?? "",
      confidenceScore: row.confidenceScore ?? 0,
      corroborationLog: JSON.parse(row.corroborationLog || "[]"),
    },
    timestamp: row.createdAt.toISOString(),
    id: row.id,
  });
}
