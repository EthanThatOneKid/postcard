import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";

// Renamed from Postmark to Postcard to simplify branding
export const PostcardSchema = z.object({
  username: z.string().optional().describe("User handle (e.g. '@elonmusk')"),
  timestampText: z
    .string()
    .optional()
    .describe('Relative or absolute post date (e.g. "2h ago")'),
  platform: z
    .enum(["X", "YouTube", "Reddit", "Instagram", "Other"])
    .default("Other"),
  engagement: z.record(z.string(), z.string()).optional(),
  mainText: z
    .string()
    .describe("Character-for-character extraction of the primary post content"),
});

export type Postcard = z.infer<typeof PostcardSchema>;

export const PostcardResultSchema = z.object({
  postcard: PostcardSchema,
  markdown: z.string(),
});

export type PostcardResult = z.infer<typeof PostcardResultSchema>;

export async function extractPostcard(
  imageBuffer: Buffer,
  mimeType: string = "image/png",
): Promise<PostcardResult> {
  const { output } = await generateText({
    model: google("gemini-1.5-flash"),
    maxRetries: 0,
    output: Output.object({
      schema: PostcardResultSchema,
    }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `
              Analyze this screenshot as a "Postcard" from the digital web.
              Extract the raw text into interleaved Markdown format.
              Also, identify the "Postcard" metadata specifically looking for:
              - User handles (@username)
              - Timestamps (e.g., "2h ago", "Feb 10")
              - Engagement metrics (likes, views, retweets)
              - Platform identity (X, YouTube, etc.)
              - UI Anchors (key buttons, logos)
            `,
          },
          {
            type: "image",
            image: imageBuffer,
            mediaType: mimeType,
          },
        ],
      },
    ],
  });

  return output;
}
