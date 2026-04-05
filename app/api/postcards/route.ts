import { NextRequest, NextResponse } from "next/server";
import {
  processPostcardFromUrl,
  processPostcardFromImage,
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

        let report;
        let forensicReport;

        if (image) {
          send("error", {
            error:
              "Image upload is not yet supported. Please submit a post URL instead.",
          });
          controller.close();
          return;
        } else {
          // URL-based analysis
          report = await processPostcardFromUrl(
            url!,
            userApiKey,
            (stage, message, progress) => {
              send("progress", { stage, message, progress });
            },
          );
          // Build forensic report from URL-based response
          forensicReport = {
            ocr: {
              markdown: report.markdown,
              postmark: {
                platform: report.platform,
                mainText: report.markdown.slice(0, 500),
              },
            },
            triangulation: {
              targetUrl: report.url,
              queries: [],
            },
            audit: {
              originScore: 0.5,
              temporalScore: 0.5,
              visualScore: 0,
              totalScore: report.postcardScore,
              auditLog: ["URL-based analysis - direct source verification"],
            },
            corroboration: report.corroboration,
            timestamp: report.timestamp,
          };
        }

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
