import { test, expect } from "@playwright/test";

test("happy path: submit post URL and see results", async ({ page }) => {
  const testUrl =
    "https://www.instagram.com/p/DV9hesME3ka/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==";

  await page.goto("http://localhost:3000");

  await expect(page.getByRole("heading", { name: "Postcard" })).toBeVisible();

  const urlInput = page.getByPlaceholder(
    "https://x.com/user/status/1234567890",
  );
  await urlInput.fill(testUrl);

  const submitButton = page.getByRole("button", { name: "Trace Post" });
  await submitButton.click();

  await expect(page.getByText("Your postcard has arrived.")).toBeVisible({
    timeout: 30000,
  });

  await expect(page.getByText("Postcard Score")).toBeVisible();
  await expect(page.getByText("Travel Log")).toBeVisible();
});
