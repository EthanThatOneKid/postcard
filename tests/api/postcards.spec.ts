import { test, expect } from "@playwright/test";

test.describe("Postcards API", () => {
  const liveTestUrls = [
    "https://www.reddit.com/r/conspiracy/comments/1rme5ri/man_claims_to_have_been_kidnapped_by_dolphins/",
    "https://x.com/Dexerto/status/2033247690058838157",
    "https://x.com/snopes/status/2036658090599219694?s=20",
  ];

  test("returns 400 without url param", async ({ request }) => {
    const response = await request.get("/api/postcards");
    expect(response.status()).toBe(400);
  });

  test("returns 404 for unknown URL", async ({ request }) => {
    const response = await request.get(
      "/api/postcards?url=https://example.com/notfound-" + Date.now(),
    );
    expect(response.status()).toBe(404);
  });

  liveTestUrls.forEach((url, index) => {
    test(`lifecycle: initiate (POST) -> poll (GET) -> retrieve (GET) for ${new URL(url).hostname} (test ${index})`, async ({
      request,
    }) => {
      // 1. Kick off analysis
      const postResponse = await request.post("/api/postcards", {
        data: { url, refresh: true },
      });
      expect(postResponse.status()).toBe(202);
      const postBody = await postResponse.json();
      expect(postBody.status).toBe("processing");
      const id = postBody.id;

      // 2. Poll via GET - should be 202 initially (but might be 200 if fast)
      const getPoll = await request.get(
        `/api/postcards?url=${encodeURIComponent(url)}`,
      );
      expect([200, 202]).toContain(getPoll.status());
      const pollBody = await getPoll.json();
      expect(pollBody.id).toBe(id);

      if (getPoll.status() === 200) {
        expect(pollBody.status).toBe("completed");
        return; // Already done
      }
      expect(pollBody.status).toBe("processing");

      // 3. Wait for completion (live mode can be slow)
      // We poll until 200 or timeout
      let finalResponse;
      const maxRetries = 30; // Increased for live testing
      for (let i = 0; i < maxRetries; i++) {
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3s between polls
        finalResponse = await request.get(
          `/api/postcards?url=${encodeURIComponent(url)}`,
        );
        if (finalResponse.status() === 200) break;
      }

      expect(finalResponse?.status()).toBe(200);
      const finalBody = await finalResponse?.json();
      expect(finalBody.id).toBe(id);
      expect(finalBody.forensicReport).toBeDefined();
      expect(finalBody.corroboration).toBeDefined();
      expect(typeof finalBody.postcardScore).toBe("number");

      // 4. Verify OG Image rendering
      const ogResponse = await request.get(`/api/postcards/${id}/og`);
      expect(ogResponse.status()).toBe(200);
      expect(ogResponse.headers()["content-type"]).toBe("image/png");
    });
  });
});
