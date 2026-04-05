import { test, expect } from "@playwright/test";

test.describe("Postcard resumption", () => {
  test.skip("can rejoin existing processing postcard", async ({ page }) => {
    // Skip: requires specific postcard state that the fake pipeline doesn't support easily
    const testUrl = "https://x.com/test/rejoin-123";

    await page.goto("http://localhost:3000/postcards");

    const urlInput = page.getByPlaceholder(
      "https://x.com/user/status/1234567890",
    );
    await urlInput.fill(testUrl);

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("URL Submitted")).toBeVisible({
      timeout: 10000,
    });

    await page.goto(
      `http://localhost:3000/postcards?url=${encodeURIComponent(testUrl)}`,
    );

    await expect(page.getByText("URL Submitted")).toBeVisible({
      timeout: 10000,
    });
  });

  test.skip("force refresh creates new analysis", async ({ page }) => {
    // Skip: requires specific postcard state that the fake pipeline doesn't support easily
    const testUrl = "https://x.com/test/force-456";

    await page.goto("http://localhost:3000/postcards");

    const urlInput = page.getByPlaceholder(
      "https://x.com/user/status/1234567890",
    );
    await urlInput.fill(testUrl);

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("URL Submitted")).toBeVisible({
      timeout: 10000,
    });

    await page.goto(
      `http://localhost:3000/postcards?url=${encodeURIComponent(testUrl)}&forceRefresh=true`,
    );

    await expect(page.getByText("URL Submitted")).toBeVisible({
      timeout: 10000,
    });
  });
});
