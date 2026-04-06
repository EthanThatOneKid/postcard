/**
 * Shared cookie helpers for the Gemini API key.
 *
 * The cookie is the single source of truth for the user's API key.
 * It is NOT httpOnly so client JS can set it, and the SSR page
 * reads it server-side via `cookies()`.
 */

export const API_KEY_COOKIE = "postcard_api_key";

/** Max-age: 30 days */
const MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Set the API key cookie from the browser.
 */
export function setApiKeyCookie(key: string) {
  document.cookie = `${API_KEY_COOKIE}=${encodeURIComponent(key.trim())}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

/**
 * Read the API key cookie from the browser.
 */
export function getApiKeyCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${API_KEY_COOKIE}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Remove the API key cookie.
 */
export function clearApiKeyCookie() {
  document.cookie = `${API_KEY_COOKIE}=; path=/; max-age=0`;
}
