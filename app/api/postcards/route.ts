import { NextRequest, NextResponse } from "next/server";
import {
  processPostcardFromUrl,
  PostcardRequestSchema,
  getExistingProcessingJob,
  createProcessingJob,
  updateAnalysisProgress,
} from "@/src/lib/postcard";
import { db } from "@/src/db";
import { analyses, posts } from "@/src/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { normalizePostUrl } from "@/src/lib/url";
import type { Corroboration } from "@/src/lib/postcard";

export const runtime = "nodejs";
export const maxDuration = 120;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

function corsResponse(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

function corsRedirect(url: string): NextResponse {
  return NextResponse.redirect(url, {
    headers: {
      ...CORS_HEADERS,
      Location: url,
    },
  });
}

interface AnalysisWithPost {
  analyses: typeof analyses.$inferSelect;
  posts: typeof posts.$inferSelect;
}

function buildReport(existing: AnalysisWithPost) {
  const { analyses: analysis, posts: post } = existing;
  const queriesExecuted = JSON.parse(
    (analysis.queriesExecuted as string) ?? "[]",
  ) as Array<{ query: string }>;
  return {
    postcard: {
      platform: analysis.platform,
      mainText: post.mainText ?? "",
      username: post.username ?? undefined,
      timestampText: post.timestampText ?? undefined,
    },
    markdown: post.markdown ?? "",
    triangulation: {
      targetUrl: analysis.url,
      queries: queriesExecuted.map((q) => q.query),
    },
    audit: {
      originScore: analysis.originScore ?? 0,
      temporalScore: analysis.temporalScore ?? 0,
      totalScore: (analysis.postcardScore ?? 0) / 100,
      auditLog: JSON.parse((analysis.auditLog as string) ?? "[]"),
    },
    corroboration: {
      primarySources: JSON.parse((analysis.primarySources as string) ?? "[]"),
      queriesExecuted,
      verdict:
        (analysis.verdict as Corroboration["verdict"]) ?? "insufficient_data",
      summary: analysis.summary ?? "",
      confidenceScore: analysis.confidenceScore ?? 0,
      corroborationLog: JSON.parse(
        (analysis.corroborationLog as string) ?? "[]",
      ),
    },
    timestamp: analysis.createdAt.toISOString(),
    analysisId: analysis.id,
  };
}

async function getLatestAnalysisByUrl(url: string) {
  const normalized = normalizePostUrl(url);
  const result = await db
    .select()
    .from(analyses)
    .innerJoin(posts, eq(posts.id, analyses.postId))
    .where(eq(posts.url, normalized))
    .orderBy(sql`${analyses.createdAt} DESC`)
    .limit(1);

  if (result.length === 0) return null;
  return result[0] as AnalysisWithPost;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return corsResponse(
      { error: "Missing required 'url' query parameter." },
      400,
    );
  }

  try {
    const normalized = normalizePostUrl(url);
    const existing = await getLatestAnalysisByUrl(normalized);

    if (!existing) {
      return corsResponse(
        {
          status: "not_found",
          error:
            "Analysis not found. POST to /api/postcards to initiate a new trace.",
        },
        404,
      );
    }

    const { analyses: analysis } = existing;

    if (analysis.status === "processing") {
      return corsResponse(
        {
          status: analysis.status,
          stage: analysis.stage,
          message: analysis.message,
          progress: analysis.progress,
        },
        200,
      );
    }

    if (analysis.status === "completed") {
      const report = buildReport(existing);
      return corsResponse(
        {
          status: analysis.status,
          ...report,
        },
        200,
      );
    }

    if (analysis.status === "failed") {
      return corsResponse(
        {
          status: analysis.status,
          error: analysis.error,
        },
        200,
      );
    }

    return corsResponse({ error: "Unknown analysis status" }, 500);
  } catch (error) {
    return corsResponse(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      500,
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = PostcardRequestSchema.safeParse(body);
  if (!parsed.success) {
    console.error("Postcard request validation failed:", parsed.error.format());
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { url, image, userApiKey, forceRefresh } = parsed.data;

  if (image) {
    return corsResponse(
      {
        error:
          "Image-based forensic analysis is currently disabled. Please provide a direct post URL for verification.",
      },
      400,
    );
  }

  try {
    const normalizedUrl = url!;

    if (!forceRefresh) {
      const latest = await getLatestAnalysisByUrl(normalizedUrl);
      if (latest) {
        const status = latest.analyses.status;

        if (status === "processing") {
          const report = buildReport(latest);
          return corsResponse(
            {
              jobId: latest.analyses.id,
              status: "processing",
              ...report,
            },
            200,
          );
        }

        if (status === "completed") {
          const report = buildReport(latest);
          await db
            .update(analyses)
            .set({ hits: sql`${analyses.hits} + 1` })
            .where(eq(analyses.id, latest.analyses.id));

          return corsResponse(
            {
              jobId: latest.analyses.id,
              status: "completed",
              ...report,
            },
            200,
          );
        }
      }
    }

    const existingProcessing = await getExistingProcessingJob(normalizedUrl);
    if (existingProcessing) {
      const report = buildReport(existingProcessing);
      return corsResponse(
        {
          jobId: existingProcessing.analyses.id,
          status: "processing",
          ...report,
        },
        200,
      );
    }

    if (forceRefresh) {
      const latest = await getLatestAnalysisByUrl(normalizedUrl);
      if (latest && latest.analyses.status === "completed") {
        await db
          .update(analyses)
          .set({ status: "pending", deletedAt: new Date() })
          .where(eq(analyses.id, latest.analyses.id));
      }
    }

    const { postId, analysisId } = await createProcessingJob(
      normalizedUrl,
      forceRefresh,
    );

    await updateAnalysisProgress(analysisId, {
      stage: "scraping",
      message: "Initializing...",
      progress: 0,
      status: "processing",
    });

    processPostcardFromUrl(
      normalizedUrl,
      userApiKey,
      (stage, message, progress) => {},
      true,
      analysisId,
    ).catch(async (err) => {
      await updateAnalysisProgress(analysisId, {
        status: "failed",
        error: err instanceof Error ? err.message : "Analysis failed",
      });
    });

    return corsResponse(
      {
        jobId: analysisId,
        status: "processing",
        message: "Analysis started",
      },
      202,
    );
  } catch (error) {
    return corsResponse(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      500,
    );
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    headers: CORS_HEADERS,
  });
}
