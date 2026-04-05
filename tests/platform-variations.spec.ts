import { test, expect } from "@playwright/test";

test.describe("Platform variations", () => {
  test("accepts X.com URL", async ({ page }) => {
    await page.goto("http://localhost:3000/postcards");

    const urlInput = page.getByLabel("Enter social media post URL");
    await urlInput.fill("https://x.com/Dexerto/status/2033247690058838157");

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("URL Submitted")).toBeVisible({
      timeout: 5000,
    });
  });

  test("accepts twitter.com URL", async ({ page }) => {
    await page.goto("http://localhost:3000/postcards");

    const urlInput = page.getByLabel("Enter social media post URL");
    await urlInput.fill(
      "https://twitter.com/snopes/status/2036658090599219694?s=20",
    );

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("URL Submitted")).toBeVisible({
      timeout: 5000,
    });
  });

  test("accepts Reddit URL", async ({ page }) => {
    await page.goto("http://localhost:3000/postcards");

    const urlInput = page.getByLabel("Enter social media post URL");
    await urlInput.fill(
      "https://www.reddit.com/r/conspiracy/comments/1rme5ri/man_claims_to_have_been_kidnapped_by_dolphins/",
    );

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("URL Submitted")).toBeVisible({
      timeout: 5000,
    });
  });
});
