import { test, expect } from "@playwright/test";

test.describe("Interaction flows", () => {
  test("shows airmail animation after URL submission", async ({ page }) => {
    await page.goto("http://localhost:3000");

    const urlInput = page.getByPlaceholder(
      "https://x.com/user/status/1234567890",
    );
    await urlInput.fill(
      "https://www.instagram.com/p/DV9hesME3ka/?utm_source=ig_web_copy_link",
    );

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.locator(".absolute.inset-0").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("Trace Another Post button reloads page", async ({ page }) => {
    await page.goto("http://localhost:3000");

    const urlInput = page.getByPlaceholder(
      "https://x.com/user/status/1234567890",
    );
    await urlInput.fill(
      "https://www.instagram.com/p/DV9hesME3ka/?utm_source=ig_web_copy_link",
    );

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("Your postcard has arrived.")).toBeVisible({
      timeout: 30000,
    });

    await page.getByRole("button", { name: "Trace Another Post" }).click();

    await expect(page.getByRole("heading", { name: "Postcard" })).toBeVisible({
      timeout: 10000,
    });
  });

  test("shows analysis journey after submission", async ({ page }) => {
    await page.goto("http://localhost:3000");

    const urlInput = page.getByPlaceholder(
      "https://x.com/user/status/1234567890",
    );
    await urlInput.fill(
      "https://www.instagram.com/p/DV9hesME3ka/?utm_source=ig_web_copy_link",
    );

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("Postcard Score")).toBeVisible({
      timeout: 30000,
    });
  });
});
