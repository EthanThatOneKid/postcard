import type { UnifiedPostClient, UnifiedPost } from "./types";

export class InstagramPostClient implements UnifiedPostClient {
  canHandle(url: string): boolean {
    const hostname = new URL(url).hostname.toLowerCase();
    const hasToken = !!process.env.INSTAGRAM_ACCESS_TOKEN;
    return hostname.includes("instagram.com") && hasToken;
  }

  async fetch(
    url: string,
    onProgress?: (message: string) => void,
  ): Promise<UnifiedPost> {
    onProgress?.("Fetching Instagram oEmbed (via Facebook)...");
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN!;

    const oembedUrl = `https://graph.facebook.com/v16.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${accessToken}`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      onProgress?.(`Instagram oEmbed failed with status ${response.status}`);
      throw new Error(`Instagram oEmbed failed: ${response.status}`);
    }

    onProgress?.("Parsing Instagram post content...");
    const data = await response.json();

    return {
      platform: "Instagram",
      title: `Instagram Post by ${data.author_name}`,
      markdown: data.html,
      author: data.author_name,
      url: url,
      engagement: {
        provider: "Instagram",
      },
      metadata: {
        author_url: data.author_url,
        provider_name: data.provider_name,
      },
    };
  }
}
