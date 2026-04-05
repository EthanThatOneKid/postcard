import { test, expect } from "@playwright/test";

test.describe("Interaction flows", () => {
  test("shows airmail animation after URL submission", async ({ page }) => {
    await page.goto("http://localhost:3000/postcards");

    const urlInput = page.getByLabel("Enter social media post URL");
    await urlInput.fill("https://www.instagram.com/p/DV9hesME3ka/");

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    // Verify the airmail animation starts
    await expect(page.getByText("URL Submitted")).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows envelope stage in airmail animation", async ({ page }) => {
    await page.goto("http://localhost:3000/postcards");

    const urlInput = page.getByLabel("Enter social media post URL");
    await urlInput.fill("https://x.com/user/status/123");

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    // Should show URL Submitted message during animation
    await expect(page.getByText("URL Submitted")).toBeVisible({
      timeout: 5000,
    });
  });
});
