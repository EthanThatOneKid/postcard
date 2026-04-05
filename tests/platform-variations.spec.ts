import { test, expect } from "@playwright/test";

test.describe("Platform variations", () => {
  test("accepts X.com URL", async ({ page }) => {
    await page.goto("http://localhost:3000/postcards");

    const urlInput = page.getByPlaceholder(
      "https://x.com/user/status/1234567890",
    );
    await urlInput.fill("https://x.com/elonmusk/status/1234567890123456789");

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("Postcard Score")).toBeVisible({
      timeout: 90000,
    });
  });

  test("accepts twitter.com URL", async ({ page }) => {
    await page.goto("http://localhost:3000/postcards");

    const urlInput = page.getByPlaceholder(
      "https://x.com/user/status/1234567890",
    );
    await urlInput.fill(
      "https://twitter.com/elonmusk/status/1234567890123456789",
    );

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("Postcard Score")).toBeVisible({
      timeout: 90000,
    });
  });

  test("accepts Instagram URL", async ({ page }) => {
    await page.goto("http://localhost:3000/postcards");

    const urlInput = page.getByPlaceholder(
      "https://x.com/user/status/1234567890",
    );
    await urlInput.fill("https://www.instagram.com/p/ABC123/");

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("Postcard Score")).toBeVisible({
      timeout: 90000,
    });
  });

  test("accepts YouTube URL", async ({ page }) => {
    await page.goto("http://localhost:3000/postcards");

    const urlInput = page.getByPlaceholder(
      "https://x.com/user/status/1234567890",
    );
    await urlInput.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("Postcard Score")).toBeVisible({
      timeout: 90000,
    });
  });

  test("accepts Reddit URL", async ({ page }) => {
    await page.goto("http://localhost:3000/postcards");

    const urlInput = page.getByPlaceholder(
      "https://x.com/user/status/1234567890",
    );
    await urlInput.fill(
      "https://www.reddit.com/r/programming/comments/abc123/some_post_title/",
    );

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("Postcard Score")).toBeVisible({
      timeout: 90000,
    });
  });

  test("accepts Bluesky URL", async ({ page }) => {
    await page.goto("http://localhost:3000/postcards");

    const urlInput = page.getByPlaceholder(
      "https://x.com/user/status/1234567890",
    );
    await urlInput.fill(
      "https://bsky.app/profile/user.bsky.social/post/abc123",
    );

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("Postcard Score")).toBeVisible({
      timeout: 30000,
    });
  });
});
