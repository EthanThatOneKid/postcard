import { cache, Suspense } from "react";
import { cookies } from "next/headers";
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
import { getBaseUrl } from "@/src/lib/config";
import { fromPostcardRow } from "@/src/api/conversions";
import { API_KEY_COOKIE } from "@/src/lib/api-key-cookie";
import PostcardsClient from "./postcards-client";
import { waitUntil } from "@vercel/functions";

interface Props {
  searchParams: Promise<{
    url?: string;
    refresh?: string;
    replay?: string;
  }>;
}

const getPostcardsByUrl = cache(
  async (
    url: string,
  ): Promise<{ postcardRow: PostcardRow; postRow: PostRow } | null> => {
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
  },
);

export async function generateMetadata({ searchParams }: Props) {
  const { url: queryUrl } = await searchParams;
  const baseUrl = getBaseUrl();

  if (!queryUrl) {
    return {
      metadataBase: new URL(baseUrl),
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
    metadataBase: new URL(baseUrl),
    title: `Postcard: ${verdictLabel} (${dbPostcard.postcardScore}/100)`,
    description: dbPostcard.summary || "View the full corroboration trace.",
    openGraph: {
      images: [
        {
          url: `/api/postcards/${dbPostcard.id}/og`,
          width: 1200,
          height: 630,
          alt: `Postcard Forensic Report: ${verdictLabel}`,
        },
      ],
    },
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
  let needsApiKey = false;

  if (normalizedUrl) {
    const data = await getPostcardsByUrl(normalizedUrl);
    const isFakeMode = process.env.NEXT_PUBLIC_FAKE_PIPELINE === "true";

    if (data) {
      const { postcardRow, postRow } = data;

      if (
        postcardRow.status === "pending" ||
        postcardRow.status === "processing"
      ) {
        // Pipeline is already running — let the client poll
        processingUrl = normalizedUrl;

        if (shouldReplay) {
          initialReport = fromPostcardRow(postcardRow, postRow);
        }
      } else if (postcardRow.status === "completed" && !shouldRefresh) {
        // Cached result — serve directly, no key needed
        initialReport = fromPostcardRow(postcardRow, postRow);
        incrementPostcardHits(postcardRow.id).catch(console.error);
      } else if (shouldRefresh) {
        // User wants to re-run — need an API key (unless in fake mode)
        const cookieStore = await cookies();
        const apiKey =
          cookieStore.get(API_KEY_COOKIE)?.value ||
          (isFakeMode ? "fake-key" : null);

        if (apiKey) {
          const { id } = await createPostcard(normalizedUrl);
          waitUntil(
            processPostcardFromUrl(
              normalizedUrl,
              apiKey,
              () => {},
              true,
              id,
            ).catch(console.error),
          );
          processingUrl = normalizedUrl;
        } else {
          needsApiKey = true;
        }
      }
    } else {
      // No cached data — need an API key to start fresh analysis (unless in fake mode)
      const cookieStore = await cookies();
      const apiKey =
        cookieStore.get(API_KEY_COOKIE)?.value ||
        (isFakeMode ? "fake-key" : null);

      if (apiKey) {
        const { id } = await createPostcard(normalizedUrl);
        waitUntil(
          processPostcardFromUrl(
            normalizedUrl,
            apiKey,
            () => {},
            true,
            id,
          ).catch(console.error),
        );
        processingUrl = normalizedUrl;
      } else {
        needsApiKey = true;
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
        needsApiKey={needsApiKey}
      />
    </Suspense>
  );
}
