import type { UnifiedPostClient, UnifiedPost } from "./types";

export class YoutubePostClient implements UnifiedPostClient {
  canHandle(url: string): boolean {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes("youtube.com") || hostname.includes("youtu.be");
  }

  async fetch(url: string): Promise<UnifiedPost> {
    const isCommunity = url.includes("/community") || url.includes("/channel/");

    if (isCommunity) {
      // YouTube Community Posts are not in the official Data API v3
      // We'll use a shadow scraper approach or a robust fallback to Jina
      throw new Error(
        "YouTube Community Posts require a specialized shadow scraper. Falling back to Jina Reader.",
      );
    }

    // For videos, we use oEmbed as a reliable starting point
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      throw new Error(`YouTube oEmbed failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      platform: "YouTube",
      title: data.title,
      markdown: `Title: ${data.title}\nAuthor: ${data.author_name}\nURL: ${url}`,
      author: data.author_name,
      url: url,
      engagement: {
        provider: "YouTube",
      },
      metadata: {
        type: data.type,
        thumbnail: data.thumbnail_url,
        provider_name: data.provider_name,
      },
    };
  }
}
