import { NextRequest, NextResponse } from "next/server";
import {
  processPostcardFromUrl,
  PostcardRequestSchema,
  getExistingProcessingPostcard,
  createPostcard,
  updateAnalysisProgress,
} from "@/src/lib/postcard";
import { db } from "@/src/db";
import { postcards, posts } from "@/src/db/schema";
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

interface PostcardWithPost {
  postcards: typeof postcards.$inferSelect;
  posts: typeof posts.$inferSelect;
}

function buildReport(existing: PostcardWithPost) {
  const { postcards: postcard, posts: post } = existing;
  const queriesExecuted = JSON.parse(
    (postcard.queriesExecuted as string) ?? "[]",
  ) as Array<{ query: string }>;
  return {
    postcard: {
      platform: postcard.platform,
      mainText: post.mainText ?? "",
      username: post.username ?? undefined,
      timestampText: post.timestampText ?? undefined,
    },
    markdown: post.markdown ?? "",
    triangulation: {
      targetUrl: postcard.url,
      queries: queriesExecuted.map((q) => q.query),
    },
    audit: {
      originScore: postcard.originScore ?? 0,
      temporalScore: postcard.temporalScore ?? 0,
      totalScore: (postcard.postcardScore ?? 0) / 100,
      auditLog: JSON.parse((postcard.auditLog as string) ?? "[]"),
    },
    corroboration: {
      primarySources: JSON.parse((postcard.primarySources as string) ?? "[]"),
      queriesExecuted,
      verdict:
        (postcard.verdict as Corroboration["verdict"]) ?? "insufficient_data",
      summary: postcard.summary ?? "",
      confidenceScore: postcard.confidenceScore ?? 0,
      corroborationLog: JSON.parse(
        (postcard.corroborationLog as string) ?? "[]",
      ),
    },
    timestamp: postcard.createdAt.toISOString(),
    analysisId: postcard.id,
  };
}

async function getLatestAnalysisByUrl(url: string) {
  const normalized = normalizePostUrl(url);
  const result = await db
    .select()
    .from(postcards)
    .innerJoin(posts, eq(posts.id, postcards.postId))
    .where(eq(posts.url, normalized))
    .orderBy(sql`${postcards.createdAt} DESC`)
    .limit(1);

  if (result.length === 0) return null;
  return result[0] as PostcardWithPost;
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

    const { postcards: analysis } = existing;

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

  const { url, userApiKey: bodyApiKey, forceRefresh } = parsed.data;

  // Check for user-provided API key in header (fallback if not in .env)
  const headerApiKey = request.headers.get("x-user-api-key");
  const userApiKey = bodyApiKey ?? headerApiKey ?? undefined;

  try {
    const normalizedUrl = url;

    if (!forceRefresh) {
      const latest = await getLatestAnalysisByUrl(normalizedUrl);
      if (latest) {
        const status = latest.postcards.status;

        if (status === "processing") {
          const report = buildReport(latest);
          return corsResponse(
            {
              postcardId: latest.postcards.id,
              status: "processing",
              ...report,
            },
            200,
          );
        }

        if (status === "completed") {
          const report = buildReport(latest);
          await db
            .update(postcards)
            .set({ hits: sql`${postcards.hits} + 1` })
            .where(eq(postcards.id, latest.postcards.id));

          return corsResponse(
            {
              postcardId: latest.postcards.id,
              status: "completed",
              ...report,
            },
            200,
          );
        }
      }
    }

    const existingProcessing =
      await getExistingProcessingPostcard(normalizedUrl);
    if (existingProcessing) {
      const report = buildReport(existingProcessing);
      return corsResponse(
        {
          postcardId: existingProcessing.postcards.id,
          status: "processing",
          ...report,
        },
        200,
      );
    }

    if (forceRefresh) {
      const latest = await getLatestAnalysisByUrl(normalizedUrl);
      if (latest && latest.postcards.status === "completed") {
        await db
          .update(postcards)
          .set({ status: "pending", deletedAt: new Date() })
          .where(eq(postcards.id, latest.postcards.id));
      }
    }

    const { postId, analysisId } = await createPostcard(
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
        postcardId: analysisId,
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
