import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { Postcard } from "../vision/ocr";

export const NavigatorResultSchema = z.object({
  url: z.string().url().optional().describe("The identified source URL"),
  queries: z
    .array(z.string())
    .describe("The search queries used for triangulation"),
});

export type NavigatorResult = z.infer<typeof NavigatorResultSchema>;

export async function navigateToSource(
  postcard: Postcard,
  markdown: string,
): Promise<NavigatorResult> {
  const { output } = await generateText({
    model: google("gemini-1.5-flash"),
    maxRetries: 0,
    tools: {
      google_search: google.tools.googleSearch({}),
    },
    output: Output.object({
      schema: NavigatorResultSchema,
    }),
    messages: [
      {
        role: "user",
        content: `
          You are the "Navigator Agent" for Postcard, a digital forensics system.
          Your goal is to triangulate the exact source URL of the provided screenshot data.

          Postcard Metadata:
          - Platform: ${postcard.platform}
          - Username: ${postcard.username ?? "unknown"}
          - Timestamp: ${postcard.timestampText ?? "unknown"}
          - Engagement: ${JSON.stringify(postcard.engagement ?? {})}

          Content Preview:
          ${markdown.slice(0, 1000)}

          Use the provided 'google_search' tool to find the original post or page on the live web.
          Focus on unique phrases, usernames, and timestamp alignment.
          Your final response MUST be the structured object containing the URL and the queries you used.
        `,
      },
    ],
  });

  return output;
}
