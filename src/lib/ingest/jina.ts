import type { UnifiedPostClient, UnifiedPost } from "./types";

export class JinaPostClient implements UnifiedPostClient {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canHandle(_url: string): boolean {
    return true;
  }

  async fetch(
    url: string,
    onProgress?: (message: string) => void,
  ): Promise<UnifiedPost> {
    onProgress?.("Connecting to Jina Reader API...");
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
