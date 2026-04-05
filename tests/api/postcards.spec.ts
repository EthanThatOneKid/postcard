import { test, expect } from "@playwright/test";

test.describe("Postcards API", () => {
  const testUrl = "https://x.com/user/status/api-test-" + Date.now();

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

  test("lifecycle: initiate (POST) -> poll (GET) -> retrieve (GET)", async ({
    request,
  }) => {
    // 1. Kick off analysis
    const postResponse = await request.post("/api/postcards", {
      data: { url: testUrl },
    });
    expect(postResponse.status()).toBe(202);
    const postBody = await postResponse.json();
    expect(postBody.status).toBe("processing");
    const id = postBody.id;

    // 2. Poll via GET - should be 202 initially
    const getPoll = await request.get(
      `/api/postcards?url=${encodeURIComponent(testUrl)}`,
    );
    expect(getPoll.status()).toBe(202);
    const pollBody = await getPoll.json();
    expect(pollBody.status).toBe("processing");
    expect(pollBody.id).toBe(id);

    // 3. Wait for completion (in fake mode this should be fast)
    // We poll until 200 or timeout
    let finalResponse;
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      finalResponse = await request.get(
        `/api/postcards?url=${encodeURIComponent(testUrl)}`,
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
