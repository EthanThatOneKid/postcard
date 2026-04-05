import { RedditPostClient } from "./reddit";
import { YoutubePostClient } from "./youtube";
import { XPostClient } from "./x";
import { InstagramPostClient } from "./instagram";
import { TikTokPostClient } from "./tiktok";
import { JinaPostClient } from "./jina";
import type { UnifiedPostClient, UnifiedPost } from "./types";

export class UnifiedPostStrategy {
  private clients: UnifiedPostClient[] = [
    new RedditPostClient(),
    new YoutubePostClient(),
    new XPostClient(),
    new InstagramPostClient(),
    new TikTokPostClient(),
    new JinaPostClient(), // Fallback
  ];

  async fetch(
    url: string,
    onProgress?: (message: string) => void,
  ): Promise<UnifiedPost> {
    const client = this.clients.find((c) => c.canHandle(url));
    if (!client) {
      throw new Error(`No client found for URL: ${url}`);
    }

    try {
      return await client.fetch(url, onProgress);
    } catch (error) {
      console.warn(
        `Primary client (${client.constructor.name}) failed. Falling back to Jina...`,
        error,
      );
      if (client instanceof JinaPostClient) throw error;
      onProgress?.("Falling back to Jina Post Client...");
      return new JinaPostClient().fetch(url, onProgress);
    }
  }
}

export const unifiedPostClient = new UnifiedPostStrategy();
