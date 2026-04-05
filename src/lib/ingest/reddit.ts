import type { UnifiedPostClient, UnifiedPost } from "./types";

export class RedditPostClient implements UnifiedPostClient {
  canHandle(url: string): boolean {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes("reddit.com");
  }

  async fetch(url: string): Promise<UnifiedPost> {
    // Ensure URL ends in .json to get structured data
    const jsonUrl = url.endsWith(".json")
      ? url
      : `${url.replace(/\/$/, "")}.json`;

    const response = await fetch(jsonUrl);
    if (!response.ok) {
      throw new Error(`Reddit API failed: ${response.status}`);
    }

    const data = await response.json();
    const post = data[0].data.children[0].data;

    return {
      platform: "Reddit",
      title: post.title,
      markdown: post.selftext || post.url,
      author: post.author,
      url: `https://www.reddit.com${post.permalink}`,
      timestamp: new Date(post.created_utc * 1000),
      engagement: {
        upvotes: post.ups.toString(),
        comments: post.num_comments.toString(),
        awards: post.total_awards_received.toString(),
      },
      metadata: {
        subreddit: post.subreddit,
        is_video: post.is_video,
        over_18: post.over_18,
      },
    };
  }
}
