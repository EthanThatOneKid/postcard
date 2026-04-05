import type { UnifiedPostClient, UnifiedPost } from "./types";

export class TikTokPostClient implements UnifiedPostClient {
  canHandle(url: string): boolean {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes("tiktok.com");
  }

  async fetch(
    url: string,
    onProgress?: (message: string) => void,
  ): Promise<UnifiedPost> {
    onProgress?.("Fetching TikTok video details...");
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      onProgress?.(`TikTok oEmbed failed with status ${response.status}`);
      throw new Error(`TikTok oEmbed failed: ${response.status}`);
    }

    onProgress?.("Parsing TikTok content metadata...");
    const data = await response.json();

    return {
      platform: "Other", // TikTok is technically 'Other' in the UI's enum for now
      title: data.title,
      markdown: `Title: ${data.title}\nAuthor: ${data.author_name}\nURL: ${url}`,
      author: data.author_name,
      url: url,
      engagement: {
        provider: "TikTok",
      },
      metadata: {
        thumbnail: data.thumbnail_url,
        author_unique_id: data.author_unique_id,
        embed_product_id: data.embed_product_id,
      },
    };
  }
}
