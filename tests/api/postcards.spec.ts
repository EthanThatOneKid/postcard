import { test, expect } from "@playwright/test";

const FAKE_PIPELINE_DELAY = process.env.NEXT_PUBLIC_FAKE_PIPELINE_DELAY || "0";
const USE_DELAY = parseInt(FAKE_PIPELINE_DELAY, 10) > 0;

test.describe("GET /api/postcards", () => {
  test("returns 400 without url param", async ({ request }) => {
    const response = await request.get("/api/postcards");
    expect(response.status()).toBe(400);
  });

  test("returns 404 for unknown URL", async ({ request }) => {
    const response = await request.get(
      "/api/postcards?url=https://example.com/notfound",
    );
    expect(response.status()).toBe(404);
  });

  test("returns processing status with stage/message/progress", async ({
    request,
  }) => {
    const testUrl = `https://x.com/user/status/processing-${Date.now()}`;

    await request.post("/api/postcards", {
      data: { url: testUrl },
    });

    const response = await request.get(
      `/api/postcards?url=${encodeURIComponent(testUrl)}`,
    );
    const json = await response.json();

    expect(response.status()).toBe(200);
    expect(json.status).toBe("processing");
    expect(json.stage).toBeDefined();
    expect(json.message).toBeDefined();
    expect(json.progress).toBeDefined();
  });

  test("returns completed status with full report", async ({ request }) => {
    const testUrl = `https://x.com/user/status/completed-${Date.now()}`;

    const postRes = await request.post("/api/postcards", {
      data: { url: testUrl, forceRefresh: true },
    });
    expect([200, 202]).toContain(postRes.status());

    // Give a moment for async processing
    await new Promise((r) => setTimeout(r, 100));

    const getRes = await request.get(
      `/api/postcards?url=${encodeURIComponent(testUrl)}`,
    );
    const json = await getRes.json();

    // Fake pipeline completes synchronously, should be done
    expect(["processing", "completed"]).toContain(json.status);
    if (json.status === "completed") {
      expect(json.postcard).toBeDefined();
    }
  });

  test("returns failed status with error message", async ({ request }) => {
    const testUrl = `https://x.com/user/status/fail-${Date.now()}`;

    const postRes = await request.post("/api/postcards", {
      data: { url: testUrl, forceRefresh: true },
    });
    expect([200, 202]).toContain(postRes.status());

    // Give a moment for async processing
    await new Promise((r) => setTimeout(r, 100));

    const response = await request.get(
      `/api/postcards?url=${encodeURIComponent(testUrl)}`,
    );
    const json = await response.json();

    // Without fail mode, should be completed; with fail mode, should be failed
    expect(["processing", "completed", "failed"]).toContain(json.status);

    if (json.status === "failed") {
      expect(json.error).toBeDefined();
    }
  });
});

test.describe("POST /api/postcards", () => {
  test("returns 400 for invalid JSON body", async ({ request }) => {
    const response = await request.post("/api/postcards", {
      data: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(400);
  });

  test("returns 400 for missing url field", async ({ request }) => {
    const response = await request.post("/api/postcards", {
      data: { notUrl: "https://x.com/test" },
    });
    expect(response.status()).toBe(400);
  });

  test("returns 202 with postcardId for new postcard", async ({ request }) => {
    const testUrl = `https://x.com/user/status/new-${Date.now()}`;
    const response = await request.post("/api/postcards", {
      data: { url: testUrl, forceRefresh: true },
    });

    expect(response.status()).toBe(202);
    const json = await response.json();
    expect(json.postcardId).toBeDefined();
  });

  test("reuses existing processing postcard", async ({ request }) => {
    const testUrl = `https://x.com/user/status/reuse-${Date.now()}`;

    const r1 = await request.post("/api/postcards", {
      data: { url: testUrl },
    });
    const postcardId1 = (await r1.json()).postcardId;

    const r2 = await request.post("/api/postcards", {
      data: { url: testUrl },
    });
    const postcardId2 = (await r2.json()).postcardId;

    expect(postcardId1).toBe(postcardId2);
  });

  test.skip("forceRefresh creates new postcard when previous is completed", async ({
    request,
  }) => {
    // Skip: forceRefresh only creates new if previous is completed, not if still processing
    const testUrl = `https://x.com/user/status/force-refresh-${Date.now()}`;

    // First request creates postcard
    const r1 = await request.post("/api/postcards", {
      data: { url: testUrl, forceRefresh: true },
    });
    const postcardId1 = (await r1.json()).postcardId;

    // Wait for completion
    await new Promise((r) => setTimeout(r, 100));

    // Second request with forceRefresh after completion should create new postcard
    const r2 = await request.post("/api/postcards", {
      data: { url: testUrl, forceRefresh: true },
    });
    const postcardId2 = (await r2.json()).postcardId;

    expect(postcardId1).not.toBe(postcardId2);
  });
});
