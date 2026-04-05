import type { UnifiedPostClient, UnifiedPost } from "./types";

export class XPostClient implements UnifiedPostClient {
  canHandle(url: string): boolean {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes("x.com") || hostname.includes("twitter.com");
  }

  async fetch(
    url: string,
    onProgress?: (message: string) => void,
  ): Promise<UnifiedPost> {
    // Twitter oEmbed API is official and requires no auth for public tweets
    onProgress?.("Connecting to X/Twitter oEmbed API...");
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      onProgress?.(`X oEmbed failed with status ${response.status}`);
      throw new Error(`X oEmbed failed: ${response.status}`);
    }

    onProgress?.("Parsing X/Twitter post content...");
    const data = await response.json();

    // Data includes author_name, author_url, html (which contains the tweet text)
    return {
      platform: "X",
      title: `Tweet by ${data.author_name}`,
      markdown: data.html, // The HTML contains the tweet text and metadata
      author: data.author_name,
      url: url,
      engagement: {
        provider: "X/Twitter",
      },
      metadata: {
        author_url: data.author_url,
        provider_name: data.provider_name,
        type: data.type,
      },
    };
  }
}
