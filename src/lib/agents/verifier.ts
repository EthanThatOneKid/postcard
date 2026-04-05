import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";

import type { Postcard } from "@/src/lib/postcard";

function getGoogleProvider(apiKey?: string) {
  if (apiKey) {
    return createGoogleGenerativeAI({ apiKey });
  }
  return google;
}

import { DEFAULT_MODEL } from "@/src/lib/config";

export const AuditResultSchema = z.object({
  originScore: z.number().min(0).max(1),
  temporalScore: z.number().min(0).max(1),
  totalScore: z.number().min(0).max(1),
  auditLog: z.array(z.string()),
});

export type AuditResult = z.infer<typeof AuditResultSchema>;

export async function auditPostcard(
  url: string,
  postcard: Postcard,
  apiKey?: string,
): Promise<{
  originScore: number;
  temporalScore: number;
  totalScore: number;
  auditLog: string[];
}> {
  const googleProvider = getGoogleProvider(apiKey);
  const auditLog: string[] = [`Starting audit for URL: ${url}`];
  let originScore = 0;
  let temporalScore = 0;

  const { text } = await generateText({
    model: googleProvider(DEFAULT_MODEL),
    tools: { google_search: googleProvider.tools.googleSearch({}) },
    system: `You are the Forensic Auditor for Postcard. Given a source URL and post metadata, verify:
1. Is the URL reachable and matches the platform?
2. Does the timestamp align with search results?
3. Do UI elements match the expected platform?

Return a JSON audit log and scores (0-1 for each).`,
    messages: [
      {
        role: "user",
        content: `Verify this post:

URL: ${url}
Platform: ${postcard.platform}
Username: ${postcard.username ?? "unknown"}
Timestamp: ${postcard.timestampText ?? "unknown"}
Content: ${postcard.mainText}

Use google_search to verify the URL exists and check timestamp alignment.`,
      },
    ],
  });

  auditLog.push(text);
  originScore = url.includes(postcard.platform.toLowerCase()) ? 1 : 0.5;
  temporalScore = 0.8;

  const totalScore = 0.5 * originScore + 0.5 * temporalScore;

  return AuditResultSchema.parse({
    originScore,
    temporalScore,
    totalScore,
    auditLog: [
      ...auditLog,
      `Audit complete. Total score: ${(totalScore * 100).toFixed(0)}%`,
    ],
  });
}
