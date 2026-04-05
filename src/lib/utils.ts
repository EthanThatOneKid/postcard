import { db } from "@/db";
import { postcards, posts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { normalizePostUrl } from "./url";

/**
 * Resolves the latest postcard ID associated with a given social media URL.
 *
 * @param url - The social media URL to resolve.
 * @returns The postcard ID or null if not found.
 */
export async function resolvePostcardIdFromUrl(
  url: string,
): Promise<string | null> {
  const normalized = normalizePostUrl(url);

  const result = await db
    .select({ id: postcards.id })
    .from(postcards)
    .innerJoin(posts, eq(posts.id, postcards.postId))
    .where(eq(posts.url, normalized))
    .orderBy(sql`${postcards.createdAt} DESC`)
    .limit(1);

  return result.length > 0 ? result[0].id : null;
}
