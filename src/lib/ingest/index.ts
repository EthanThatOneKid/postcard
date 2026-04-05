import { RedditPostClient } from "./reddit";
import { YoutubePostClient } from "./youtube";
import { JinaPostClient } from "./jina";
import type { UnifiedPostClient, UnifiedPost } from "./types";

export class UnifiedPostStrategy {
  private clients: UnifiedPostClient[] = [
    new RedditPostClient(),
    new YoutubePostClient(),
    new JinaPostClient(), // Fallback
  ];

  async fetch(url: string): Promise<UnifiedPost> {
    const client = this.clients.find((c) => c.canHandle(url));
    if (!client) {
      throw new Error(`No client found for URL: ${url}`);
    }

    try {
      return await client.fetch(url);
    } catch (error) {
      console.warn(
        `Primary client (${client.constructor.name}) failed. Falling back to Jina...`,
        error,
      );
      if (client instanceof JinaPostClient) throw error;
      return new JinaPostClient().fetch(url);
    }
  }
}

export const unifiedPostClient = new UnifiedPostStrategy();
