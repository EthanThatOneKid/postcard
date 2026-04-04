import { NextRequest, NextResponse } from "next/server";
import { processPostcardFromUrl, PostcardRequestSchema } from "@/lib/postcard";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const postcardId = crypto.randomUUID();

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

  const { url, userApiKey } = parsed.data;

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
          message: "Initializing postcard...",
          progress: 0,
          postcardId,
        });

        const report = await processPostcardFromUrl(
          url,
          userApiKey,
          (stage, message, progress) => {
            send("progress", { stage, message, progress });
          },
        );

        send("complete", { postcard: report });
      } catch (error) {
        send("error", {
          error: error instanceof Error ? error.message : "Postcard failed",
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
      "X-Postcard-Id": postcardId,
    },
  });
}
