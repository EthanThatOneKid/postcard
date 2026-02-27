import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { Postmark } from "../vision/ocr";

/**
 * The "Navigator Agent" refactored to use AI SDK v6 and Google Search Grounding.
 * This directly triangulates the source URL using Gemini's native search capabilities.
 */
export async function navigateToSource(postmark: Postmark, markdown: string): Promise<{ url: string | undefined; queries: string[] }> {
  // Use generateText with Output.object (AI SDK v6)
  // And Google Search Grounding via google.tools.googleSearch()
  const { output } = await generateText({
    model: google('gemini-2.0-flash'),
    tools: {
      google_search: google.tools.googleSearch({}),
    },
    output: Output.object({
      schema: z.object({
        url: z.string().url().optional().describe('The identified source URL'),
        queries: z.array(z.string()).describe('The search queries used for triangulation')
      }),
    }),
    messages: [
      {
        role: 'user',
        content: `
          You are the "Navigator Agent" for Postcard, a digital forensics system.
          Your goal is to triangulate the exact source URL of the provided screenshot data.
          
          Postmark Metadata:
          - Platform: ${postmark.platform}
          - Username: ${postmark.username}
          - Timestamp: ${postmark.timestampText}
          - Engagement: ${JSON.stringify(postmark.engagement)}
          
          Content Preview:
          ${markdown.slice(0, 1000)}

          Use the provided 'google_search' tool to find the original post or page on the live web. 
          Focus on unique phrases, usernames, and timestamp alignment.
          Your final response MUST be the structured object containing the URL and the queries you used.
        `
      }
    ]
  });

  return {
    url: output.url,
    queries: output.queries
  };
}
