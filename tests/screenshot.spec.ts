import { test, expect } from "@playwright/test";

test("screenshot live run", async ({ page }) => {
  test.setTimeout(120000); // 2 minutes just in case
  const testUrl =
    "https://www.reddit.com/r/conspiracy/comments/1rme5ri/man_claims_to_have_been_kidnapped_by_dolphins/";

  await page.goto("http://localhost:3000/postcards");

  // 1. Landing Snapshot
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000); // Wait for Framer Motion entrance animations to settle
  await page.screenshot({ path: "docs/landing.png", fullPage: true });

  // 2. Submit URL
  const urlInput = page.getByLabel("Enter social media post URL");
  await urlInput.fill(testUrl);
  const submitButton = page.getByRole("button", { name: "Trace Post" });
  await submitButton.click();

  // 3. Processing Animation Snapshot
  await expect(page.getByText("URL Submitted")).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(1000); // Wait for the envelope animation to fully slide into view
  await page.screenshot({ path: "docs/processing.png" });

  // 4. Wait for analysis to complete and show results (wait for verdict or score)
  // The layout will eventually switch to forensic report.
  // We can wait for the report container or "Postcard Verification" text.
  const scoreDisplay = page.getByText("Postcard Score");
  await scoreDisplay.waitFor({ state: "visible", timeout: 90000 });

  // 5. Final Report Snapshot
  await page.waitForTimeout(3000); // give animations a moment to settle
  await page.screenshot({ path: "docs/report.png", fullPage: true });
});
