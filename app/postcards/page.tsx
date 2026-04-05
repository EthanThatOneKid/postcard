import { Suspense } from "react";
import { db } from "@/src/db";
import { postcards, posts, PostcardRowSchema } from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";
import { normalizePostUrl } from "@/src/lib/url";
import PostcardsClient from "./postcards-client";

interface Props {
  searchParams: Promise<{ url?: string; forceRefresh?: string }>;
}

async function getPostcardsRowByUrl(url: string) {
  const normalized = normalizePostUrl(url);
  const result = await db
    .select()
    .from(postcards)
    .innerJoin(posts, eq(posts.id, postcards.postId))
    .where(eq(posts.url, normalized))
    .orderBy(sql`${postcards.createdAt} DESC`)
    .limit(1);

  if (result.length === 0) return null;
  const { postcards: row, posts: post } = result[0];
  return {
    row: PostcardRowSchema.parse(row),
    post: post,
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
  const data = await getPostcardsRowByUrl(decodedUrl);

  if (!data) {
    const domain = decodedUrl.includes("://")
      ? decodedUrl.split("://")[1].split("/")[0]
      : "";
    return {
      title: domain ? `Tracing ${domain} Post...` : "Tracing Postcard...",
      description: `Initializing forensic trace for content from ${domain || "social media"}.`,
    };
  }

  const { row } = data;
  const verdictMap = {
    verified: "✅ Verified",
    disputed: "❌ Disputed",
    inconclusive: "❓ Inconclusive",
    insufficient_data: "⚠️ Insufficient Data",
  };

  const verdictLabel =
    verdictMap[row.verdict as keyof typeof verdictMap] ?? row.verdict;

  return {
    title: `Postcard: ${verdictLabel} (${row.postcardScore}/100)`,
    description: row.summary || "View the full corroboration trace.",
  };
}

export default async function PostcardsPage({ searchParams }: Props) {
  const { url: queryUrl, forceRefresh } = await searchParams;

  const decodedUrl = queryUrl ? decodeURIComponent(queryUrl) : null;
  const normalizedUrl = decodedUrl ? normalizePostUrl(decodedUrl) : null;

  let initialReport = null;
  let processingUrl = null;

  if (normalizedUrl && !forceRefresh) {
    const data = await getPostcardsRowByUrl(normalizedUrl);
    if (data) {
      const queriesExecuted = JSON.parse(data.row.queriesExecuted ?? "[]");
      initialReport = {
        postcard: {
          platform:
            (data.row.platform as
              | "X"
              | "YouTube"
              | "Reddit"
              | "Instagram"
              | "Other") || "Other",
          mainText: data.post.mainText || "",
          username: data.post.username || undefined,
          timestampText: data.post.timestampText || undefined,
        },
        markdown: data.post.markdown || "",
        triangulation: {
          targetUrl: data.row.url,
          queries: queriesExecuted.map((q: { query: string }) => q.query),
        },
        audit: {
          originScore: data.row.originScore ?? 0,
          temporalScore: data.row.temporalScore ?? 0,
          totalScore: data.row.postcardScore / 100,
          auditLog: JSON.parse(data.row.auditLog ?? "[]"),
        },
        corroboration: {
          primarySources: JSON.parse(data.row.primarySources ?? "[]"),
          queriesExecuted,
          verdict:
            (data.row.verdict as
              | "verified"
              | "disputed"
              | "inconclusive"
              | "insufficient_data") ?? "insufficient_data",
          summary: data.row.summary ?? "",
          confidenceScore: data.row.confidenceScore ?? 0,
          corroborationLog: JSON.parse(data.row.corroborationLog ?? "[]"),
        },
        timestamp: data.row.createdAt.toISOString(),
        id: data.row.id,
      };
    }
  } else if (normalizedUrl && forceRefresh) {
    processingUrl = normalizedUrl;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostcardsClient
        initialUrl={normalizedUrl}
        initialReport={initialReport}
        processingUrl={processingUrl}
      />
    </Suspense>
  );
}
