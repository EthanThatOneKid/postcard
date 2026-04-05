import type { UnifiedPostClient, UnifiedPost } from "./types";

export class JinaPostClient implements UnifiedPostClient {
  canHandle(_: string): boolean {
    return true; // Final fallback
  }

  async fetch(url: string): Promise<UnifiedPost> {
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    const response = await fetch(jinaUrl);

    if (!response.ok) {
      throw new Error(`Jina Reader failed: ${response.status}`);
    }

    const markdown = await response.text();

    return {
      platform: "Other",
      markdown,
      url,
      metadata: {
        source: "Jina AI",
      },
    };
  }
}
