import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { postcards, posts } from "@/src/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  PostcardRequestSchema,
  PostcardResponseSchema,
} from "@/src/api/schemas";
import { normalizePostUrl } from "@/src/lib/url";
import {
  createPostcard,
  getExistingProcessingPostcard,
  processPostcardFromUrl,
} from "@/src/lib/postcard";
import { dbRowToReport } from "@/src/api/conversions";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const refresh = searchParams.get("refresh") === "true";

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const normalizedUrl = normalizePostUrl(url);

    // 1. If NOT refreshing, try to find cached result
    if (!refresh) {
      const result = await db
        .select()
        .from(postcards)
        .innerJoin(posts, eq(posts.id, postcards.postId))
        .where(eq(postcards.url, normalizedUrl))
        .orderBy(sql`${postcards.createdAt} DESC`)
        .limit(1);

      if (result.length > 0) {
        const { postcards: row, posts: post } = result[0];

        // If it's still processing, return a 202 status for polling parity
        if (row.status === "pending" || row.status === "processing") {
          return NextResponse.json(
            {
              status: "processing",
              id: row.id,
              message: row.message || "Forensic trace in progress...",
            },
            { status: 202, headers: CORS_HEADERS },
          );
        }

        // If it failed, return the error context
        if (row.status === "failed") {
          return NextResponse.json(
            {
              status: "failed",
              id: row.id,
              error: row.error || "Analysis failed.",
            },
            { status: 200, headers: CORS_HEADERS },
          );
        }

        const report = dbRowToReport(row, post);

        return NextResponse.json(
          PostcardResponseSchema.parse({
            url: normalizedUrl,
            markdown: post.markdown || "",
            platform: row.platform || "Other",
            corroboration: report.corroboration,
            postcardScore: row.postcardScore / 100,
            timestamp: row.createdAt.toISOString(),
            id: row.id,
            forensicReport: report,
          }),
          { headers: CORS_HEADERS },
        );
      }

      // If not refreshing and not found, return 404 (parity with tests)
      return NextResponse.json(
        {
          status: "not_found",
          error:
            "Analysis not found. Use ?refresh=true to initiate a new trace.",
        },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    // 2. If refresh=true OR forced by logic above, start fresh analysis
    const { id } = await createPostcard(normalizedUrl);
    processPostcardFromUrl(normalizedUrl, undefined, () => {}, true, id).catch(
      (err) => console.error("Background trace failed:", err),
    );

    return NextResponse.json(
      {
        status: "processing",
        id,
        message: "Forensic trace initialized.",
      },
      { status: 202, headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("API GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, userApiKey, refresh } = PostcardRequestSchema.parse(body);
    const normalizedUrl = normalizePostUrl(url);

    if (!refresh) {
      // 1. Check for active/processing jobs to avoid double-processing
      const processing = await getExistingProcessingPostcard(normalizedUrl);
      if (processing) {
        return NextResponse.json(
          {
            status: "processing",
            id: processing.postcards.id,
            message: "An analysis for this URL is already in progress.",
          },
          { status: 202, headers: CORS_HEADERS },
        );
      }

      // 2. Check for completed cached analysis
      const existingResult = await db
        .select()
        .from(postcards)
        .innerJoin(posts, eq(posts.url, normalizedUrl))
        .orderBy(sql`${postcards.createdAt} DESC`)
        .limit(1);

      if (existingResult.length > 0) {
        const { postcards: row, posts: post } = existingResult[0];
        if (row.status === "completed") {
          const report = dbRowToReport(row, post);
          return NextResponse.json(
            PostcardResponseSchema.parse({
              url: normalizedUrl,
              markdown: post.markdown || "",
              platform: row.platform || "Other",
              corroboration: report.corroboration,
              postcardScore: row.postcardScore / 100,
              timestamp: row.createdAt.toISOString(),
              id: row.id,
              forensicReport: report,
            }),
            { headers: CORS_HEADERS },
          );
        }
      }
    }

    // 3. Start fresh analysis
    const { id } = await createPostcard(normalizedUrl);

    // We don't await the full pipeline in the HTTP request to avoid timeouts
    processPostcardFromUrl(normalizedUrl, userApiKey, () => {}, true, id).catch(
      (err) => console.error("Background trace failed:", err),
    );

    return NextResponse.json(
      {
        status: "processing",
        id,
        message: "Forensic trace initialized.",
      },
      { status: 202, headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
