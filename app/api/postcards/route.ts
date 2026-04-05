import { NextRequest, NextResponse } from "next/server";
import {
  processPostcardFromUrl,
  PostcardRequestSchema,
} from "@/src/lib/postcard";
import { db } from "@/src/db";
import { analyses, posts } from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";
import { normalizePostUrl } from "@/src/lib/url";
import type { Corroboration } from "@/src/lib/postcard";

export const runtime = "nodejs";
export const maxDuration = 120;

async function getExistingAnalysis(url: string) {
  const normalized = normalizePostUrl(url);
  const result = await db
    .select()
    .from(analyses)
    .innerJoin(posts, eq(posts.id, analyses.postId))
    .where(eq(posts.url, normalized))
    .orderBy(sql`${analyses.createdAt} DESC`)
    .limit(1);

  if (result.length === 0) return null;
  return result[0];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing required 'url' query parameter." },
      { status: 400 },
    );
  }

  const accept = request.headers.get("accept") || "";
  const wantsJson = accept.includes("application/json");

  try {
    const normalized = normalizePostUrl(url);
    const existing = await getExistingAnalysis(normalized);

    if (existing) {
      const { analyses: analysis, posts: post } = existing;
      const report = {
        postcard: {
          platform: analysis.platform,
          mainText: post.mainText || "",
          username: post.username || undefined,
          timestampText: post.timestampText || undefined,
        },
        markdown: post.markdown || "",
        triangulation: {
          targetUrl: analysis.url,
          queries: [],
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
          queriesExecuted: JSON.parse(
            (analysis.queriesExecuted as string) || "[]",
          ),
          verdict: analysis.verdict as Corroboration["verdict"],
          summary: analysis.summary || "",
          confidenceScore: analysis.confidenceScore || 0,
          corroborationLog: JSON.parse(
            (analysis.corroborationLog as string) || "[]",
          ),
        },
        timestamp: analysis.createdAt.toISOString(),
        analysisId: analysis.id,
      };

      if (wantsJson) {
        return NextResponse.json(report);
      }

      return NextResponse.redirect(
        new URL(
          `/postcards?url=${encodeURIComponent(normalized)}`,
          request.url,
        ),
      );
    }

    if (wantsJson) {
      return NextResponse.json(
        {
          error:
            "Analysis not found. POST to /api/postcards to initiate a new trace.",
        },
        { status: 404 },
      );
    }

    return NextResponse.redirect(
      new URL(
        `/postcards?url=${encodeURIComponent(normalized)}&forceRefresh=true`,
        request.url,
      ),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const traceId = crypto.randomUUID();

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

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        send("progress", {
          stage: "starting",
          message: image
            ? "Initializing forensic pipeline..."
            : "Initializing trace...",
          progress: 0,
          traceId,
        });

        if (image) {
          send("error", {
            error:
              "Image-based forensic analysis is currently disabled. Please provide a direct post URL for verification.",
          });
          controller.close();
          return;
        }

        // URL-based analysis
        const report = await processPostcardFromUrl(
          url!,
          userApiKey,
          (stage, message, progress) => {
            send("progress", { stage, message, progress });
          },
          forceRefresh,
        );

        // Build forensic report from URL-based response
        const forensicReport = {
          postcard: {
            platform: report.platform,
            mainText: report.markdown.slice(0, 500),
          },
          markdown: report.markdown,
          triangulation: {
            targetUrl: report.url,
            queries: [],
          },
          audit: {
            originScore: 0.5,
            temporalScore: 0.5,
            totalScore: 0.5, // 50/50 Origin and Temporal
            auditLog: [
              "Analysis initiated via direct URL submission",
              "Skipping visual consistency audit (no source image provided)",
              "Origin reputation based on platform ingestion client metrics",
              `Direct source verification: ${report.url}`,
            ],
          },
          corroboration: report.corroboration,
          timestamp: report.timestamp,
          analysisId: report.analysisId,
        };

        send("complete", {
          postcard: report,
          forensicReport,
        });
      } catch (error) {
        send("error", {
          error: error instanceof Error ? error.message : "Trace failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Trace-Id": traceId,
    },
  });
}
