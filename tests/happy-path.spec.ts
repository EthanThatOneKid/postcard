import { test, expect } from "@playwright/test";

test("happy path: submit post URL and see results", async ({ page }) => {
  const testUrl =
    "https://www.reddit.com/r/conspiracy/comments/1rmd9ef/dolphinsaliens/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button";
  // Test case: "dolphins/aliens" conspiracy post on Reddit - easier to fetch via Jina Reader than Instagram

  await page.goto("http://localhost:3000");

  await expect(page.getByRole("heading", { name: "Postcard" })).toBeVisible();

  const urlInput = page.getByPlaceholder(
    "https://x.com/user/status/1234567890",
  );
  await urlInput.fill(testUrl);

  const submitButton = page.getByRole("button", { name: "Trace Post" });
  await submitButton.click();

  await expect(page.getByText("Postcard Score")).toBeVisible({
    timeout: 30000,
  });

  await expect(page.getByText("Travel Log")).toBeVisible();
});
