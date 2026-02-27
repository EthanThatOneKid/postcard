import { GoogleGenerativeAI } from '@google/generative-ai';
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
 * Extracts OCR data and Postmark metadata from an image using Gemini 2.0.
 */
export async function extractPostmark(imageBuffer: Buffer, mimeType: string = 'image/png'): Promise<OCRResult> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Analyze this screenshot as a "Postcard" from the digital web.
    Extract the raw text into interleaved Markdown format.
    Also, identify the "Postmark" metadata specifically looking for:
    - User handles (@username)
    - Timestamps (e.g., "2h ago", "Feb 10")
    - Engagement metrics (likes, views, retweets)
    - Platform identity (X, YouTube, etc.)
    - UI Anchors (key buttons, logos)

    Return the result as a JSON object matching this schema:
    {
      "markdown": "...",
      "postmark": { ... }
    }
  `;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType
      }
    }
  ]);

  const responseText = result.response.text();
  // Clean up JSON if it contains markdown code blocks
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse JSON from Gemini response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    markdown: parsed.markdown,
    postmark: PostmarkSchema.parse(parsed.postmark)
  };
}
