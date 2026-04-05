import { test, expect } from "@playwright/test";

test.describe("Error cases", () => {
  test("shows error for empty input", async ({ page }) => {
    await page.goto("http://localhost:3000/postcards");

    await expect(page.getByRole("heading", { name: "Postcard" })).toBeVisible();

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("Please enter a post URL.")).toBeVisible();
  });

  test("shows error for invalid URL", async ({ page }) => {
    await page.goto("http://localhost:3000/postcards");

    const urlInput = page.getByLabel("Enter social media post URL");
    await expect(urlInput).toBeVisible();
    await urlInput.fill("not-a-valid-url");

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("Please enter a valid URL.")).toBeVisible();
  });

  test("shows error for malformed URL", async ({ page }) => {
    await page.goto("http://localhost:3000/postcards");

    const urlInput = page.getByLabel("Enter social media post URL");
    await expect(urlInput).toBeVisible();
    await urlInput.fill("://missing-protocol");

    const submitButton = page.getByRole("button", { name: "Trace Post" });
    await submitButton.click();

    await expect(page.getByText("Please enter a valid URL.")).toBeVisible();
  });
});
