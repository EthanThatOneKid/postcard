import { Suspense } from "react";
import { db } from "@/src/db";
import {
  postcards,
  posts,
  type PostcardRow,
  type PostRow,
} from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";
import { normalizePostUrl } from "@/src/lib/url";
import {
  createPostcard,
  processPostcardFromUrl,
  incrementPostcardHits,
} from "@/src/lib/postcard";
import { dbRowToReport } from "@/src/api/conversions";
import PostcardsClient from "./postcards-client";

interface Props {
  searchParams: Promise<{
    url?: string;
    refresh?: string;
    replay?: string;
  }>;
}

async function getPostcardsByUrl(
  url: string,
): Promise<{ postcardRow: PostcardRow; postRow: PostRow } | null> {
  const normalized = normalizePostUrl(url);
  const result = await db
    .select()
    .from(postcards)
    .innerJoin(posts, eq(posts.id, postcards.postId))
    .where(eq(posts.url, normalized))
    .orderBy(sql`${postcards.createdAt} DESC`)
    .limit(1);

  if (result.length === 0) return null;
  return {
    postcardRow: result[0].postcards,
    postRow: result[0].posts,
  };
}

export async function generateMetadata({ searchParams }: Props) {
  const { url: queryUrl } = await searchParams;

  if (!queryUrl) {
    return {
      title: "Postcard — Trace every post back to its source",
      description: "Verify social media posts with AI-powered forensics.",
    };
  }

  const decodedUrl = decodeURIComponent(queryUrl);
  const data = await getPostcardsByUrl(decodedUrl);

  if (!data) {
    const domain = decodedUrl.includes("://")
      ? decodedUrl.split("://")[1].split("/")[0]
      : "";
    return {
      title: domain ? `Tracing ${domain} Post...` : "Tracing Postcard...",
      description: `Initializing forensic trace for content from ${domain || "social media"}.`,
    };
  }

  const { postcardRow: dbPostcard } = data;
  const verdictMap = {
    verified: "✅ Verified",
    disputed: "❌ Disputed",
    inconclusive: "❓ Inconclusive",
    insufficient_data: "⚠️ Insufficient Data",
  };

  const verdictLabel =
    verdictMap[dbPostcard.verdict as keyof typeof verdictMap] ??
    dbPostcard.verdict ??
    "Processing";

  return {
    title: `Postcard: ${verdictLabel} (${dbPostcard.postcardScore}/100)`,
    description: dbPostcard.summary || "View the full corroboration trace.",
  };
}

export default async function PostcardsPage({ searchParams }: Props) {
  const { url: queryUrl, refresh, replay } = await searchParams;

  const decodedUrl = queryUrl ? decodeURIComponent(queryUrl) : null;
  const normalizedUrl = decodedUrl ? normalizePostUrl(decodedUrl) : null;
  const shouldRefresh = refresh === "true";
  const shouldReplay = replay === "true";

  let initialReport = null;
  let processingUrl = null;

  if (normalizedUrl) {
    const data = await getPostcardsByUrl(normalizedUrl);
    if (data && !shouldRefresh) {
      initialReport = dbRowToReport(data.postcardRow, data.postRow);
      // Increment hit counter on every view of a completed report
      if (data.postcardRow.status === "completed") {
        incrementPostcardHits(data.postcardRow.id).catch(console.error);
      }
    } else if (normalizedUrl && (shouldRefresh || !data)) {
      // Start fresh analysis if refresh=true OR no cached data exists
      const { id } = await createPostcard(normalizedUrl);
      processPostcardFromUrl(
        normalizedUrl,
        undefined,
        () => {},
        true,
        id,
      ).catch(console.error);
      processingUrl = normalizedUrl;

      // Even on refresh, if we have old data, we can use it for the "replay" mock
      // This solves the refresh+replay stall.
      if (data && shouldReplay) {
        initialReport = dbRowToReport(data.postcardRow, data.postRow);
      }
    }
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostcardsClient
        initialUrl={normalizedUrl}
        initialReport={initialReport}
        processingUrl={processingUrl}
        shouldReplay={shouldReplay}
      />
    </Suspense>
  );
}
