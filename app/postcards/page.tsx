import { Suspense } from "react";
import { db } from "@/src/db";
import { postcards, posts } from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";
import { normalizePostUrl } from "@/src/lib/url";
import PostcardsClient from "./postcards-client";

interface Props {
  searchParams: Promise<{ url?: string; forceRefresh?: string }>;
}

async function getAnalysisByUrl(url: string) {
  const normalized = normalizePostUrl(url);
  const result = await db
    .select()
    .from(postcards)
    .innerJoin(posts, eq(posts.id, postcards.postId))
    .where(eq(posts.url, normalized))
    .orderBy(sql`${postcards.createdAt} DESC`)
    .limit(1);

  if (result.length === 0) return null;
  return result[0];
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
  const data = await getAnalysisByUrl(decodedUrl);

  if (!data) {
    const domain = decodedUrl.includes("://")
      ? decodedUrl.split("://")[1].split("/")[0]
      : "";
    return {
      title: domain ? `Tracing ${domain} Post...` : "Tracing Postcard...",
      description: `Initializing forensic trace for content from ${domain || "social media"}.`,
    };
  }

  const { postcards: analysis } = data;
  const verdictMap = {
    verified: "✅ Verified",
    disputed: "❌ Disputed",
    inconclusive: "❓ Inconclusive",
    insufficient_data: "⚠️ Insufficient Data",
  };

  const verdictLabel =
    verdictMap[analysis.verdict as keyof typeof verdictMap] || analysis.verdict;

  return {
    title: `Postcard: ${verdictLabel} (${analysis.postcardScore}/100)`,
    description: analysis.summary || "View the full corroboration trace.",
  };
}

export default async function PostcardsPage({ searchParams }: Props) {
  const { url: queryUrl, forceRefresh } = await searchParams;

  const decodedUrl = queryUrl ? decodeURIComponent(queryUrl) : null;
  const normalizedUrl = decodedUrl ? normalizePostUrl(decodedUrl) : null;

  let initialReport = null;
  let processingUrl = null;

  if (normalizedUrl && !forceRefresh) {
    const data = await getAnalysisByUrl(normalizedUrl);
    if (data) {
      const { postcards: analysis, posts: post } = data;
      const queriesExecuted = JSON.parse(
        (analysis.queriesExecuted as string) || "[]",
      ) as Array<{ query: string; sourcesFound: number }>;
      initialReport = {
        postcard: {
          platform:
            (analysis.platform as
              | "X"
              | "YouTube"
              | "Reddit"
              | "Instagram"
              | "Other") || "Other",
          mainText: post.mainText || "",
          username: post.username || undefined,
          timestampText: post.timestampText || undefined,
        },
        markdown: post.markdown || "",
        triangulation: {
          targetUrl: analysis.url,
          queries: queriesExecuted.map((q) => q.query),
        },
        audit: {
          originScore: analysis.originScore || 0,
          temporalScore: analysis.temporalScore || 0,
          totalScore: analysis.postcardScore / 100,
          auditLog: JSON.parse((analysis.auditLog as string) || "[]"),
        },
        corroboration: {
          primarySources: JSON.parse(
            (analysis.primarySources as string) || "[]",
          ),
          queriesExecuted,
          verdict:
            (analysis.verdict as
              | "verified"
              | "disputed"
              | "inconclusive"
              | "insufficient_data") || "insufficient_data",
          summary: analysis.summary || "",
          confidenceScore: analysis.confidenceScore || 0,
          corroborationLog: JSON.parse(
            (analysis.corroborationLog as string) || "[]",
          ),
        },
        timestamp: analysis.createdAt.toISOString(),
        analysisId: analysis.id,
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
