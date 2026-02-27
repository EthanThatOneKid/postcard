import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';

// Define the Postmark metadata schema
export const PostmarkSchema = z.object({
  username: z.string().optional().describe('Found handles like @username'),
  timestampText: z.string().optional().describe('Relative or absolute timestamp in the shot (e.g. "2h ago", "Oct 12, 2025")'),
  platform: z.enum(['X', 'YouTube', 'Reddit', 'Instagram', 'Other']).default('Other'),
  engagement: z.object({
    likes: z.string().optional(),
    retweets: z.string().optional(),
    views: z.string().optional(),
  }).optional(),
  mainText: z.string().describe('The primary content of the postcard'),
  uiAnchors: z.array(z.object({
    element: z.string(),
    position: z.string(),
    confidence: z.number()
  })).optional()
});

export type Postmark = z.infer<typeof PostmarkSchema>;

export interface OCRResult {
  markdown: string;
  postmark: Postmark;
}

/**
 * Extracts OCR data and Postmark metadata from an image using Vercel AI SDK and Gemini 2.0.
 * Updated to use generateText with Output.object as per AI SDK v6.
 */
export async function extractPostmark(imageBuffer: Buffer, mimeType: string = 'image/png'): Promise<OCRResult> {
  const { output } = await generateText({
    model: google('gemini-2.0-flash'),
    output: Output.object({
      schema: z.object({
        markdown: z.string().describe('Raw extracted text in interleaved Markdown format'),
        postmark: PostmarkSchema
      }),
    }),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `
              Analyze this screenshot as a "Postcard" from the digital web.
              Extract the raw text into interleaved Markdown format.
              Also, identify the "Postmark" metadata specifically looking for:
              - User handles (@username)
              - Timestamps (e.g., "2h ago", "Feb 10")
              - Engagement metrics (likes, views, retweets)
              - Platform identity (X, YouTube, etc.)
              - UI Anchors (key buttons, logos)
            `
          },
          {
            type: 'image',
            image: imageBuffer,
          }
        ]
      }
    ]
  });

  return output;
}
