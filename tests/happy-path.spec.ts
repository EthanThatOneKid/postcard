import { test, expect } from "@playwright/test";

test("happy path: submit post URL triggers analysis", async ({ page }) => {
  const testUrl =
    "https://www.reddit.com/r/conspiracy/comments/1rmd9ef/dolphinsaliens/";

  await page.goto("http://localhost:3000/postcards");

  await expect(page.getByRole("heading", { name: "Postcard" })).toBeVisible();

  const urlInput = page.getByLabel("Enter social media post URL");
  await urlInput.fill(testUrl);

  const submitButton = page.getByRole("button", { name: "Trace Post" });
  await submitButton.click();

  // Verify the airmail animation starts (URL submission confirmation)
  await expect(page.getByText("URL Submitted")).toBeVisible({
    timeout: 10000,
  });
});
