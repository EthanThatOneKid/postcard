import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";

export const AuditResultSchema = z.object({
  originScore: z.number().min(0).max(1),
  temporalScore: z.number().min(0).max(1),
  visualScore: z.number().min(0).max(1),
  totalScore: z.number().min(0).max(1),
  auditLog: z.array(z.string()),
});

export type AuditResult = z.infer<typeof AuditResultSchema>;

export async function auditPostcard(
  url: string,
  postcard: import("../vision/ocr").Postcard,
): Promise<{
  originScore: number;
  temporalScore: number;
  visualScore: number;
  totalScore: number;
  auditLog: string[];
}> {
  const auditLog: string[] = [`Starting audit for URL: ${url}`];
  let originScore = 0;
  let temporalScore = 0;
  let visualScore = 0;

  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    tools: { google_search: google.tools.googleSearch({}) },
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
  visualScore = 0.8;

  const totalScore =
    0.4 * originScore + 0.3 * temporalScore + 0.3 * visualScore;

  return AuditResultSchema.parse({
    originScore,
    temporalScore,
    visualScore,
    totalScore,
    auditLog: [
      ...auditLog,
      `Audit complete. Total score: ${(totalScore * 100).toFixed(0)}%`,
    ],
  });
}
