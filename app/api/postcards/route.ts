import { NextRequest, NextResponse } from "next/server";
import {
  processPostcardFromUrl,
  PostcardRequestSchema,
} from "@/src/lib/postcard";

export const runtime = "nodejs";
export const maxDuration = 120;

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
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { url, image, userApiKey } = parsed.data;

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
