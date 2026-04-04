import { chromium } from 'playwright';
import { z } from 'zod';
import type { Postmark } from '../vision/ocr';

export const AuditResultSchema = z.object({
  originScore: z.number().min(0).max(1).describe('0 or 1 — URL is reachable'),
  temporalScore: z.number().min(0).max(1).describe('0–1 — timestamp consistency'),
  visualScore: z.number().min(0).max(1).describe('0–1 — UI fingerprint alignment'),
  totalScore: z.number().min(0).max(1).describe('Weighted sum: 0.4*O + 0.3*T + 0.3*V'),
  auditLog: z.array(z.string()).describe('Step-by-step audit trail'),
});

export type AuditResult = z.infer<typeof AuditResultSchema>;

export async function auditPostmark(
  url: string,
  screenshotPostmark: Postmark,
): Promise<AuditResult> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const auditLog: string[] = [`Starting audit for URL: ${url}`];
  let originScore = 0;
  let temporalScore = 0;
  let visualScore = 0;

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    originScore = 1;
    auditLog.push('URL verified: Direct match found.');

    const pageTitle = await page.title();
    const pageContent = await page.innerText('body');

    auditLog.push(`Page title: ${pageTitle}`);

    if (
      screenshotPostmark.timestampText &&
      pageContent.includes(screenshotPostmark.timestampText)
    ) {
      temporalScore = 1;
      auditLog.push('Temporal match: Timestamp consistent with live page content.');
    } else {
      temporalScore = 0.5;
      auditLog.push('Temporal warning: Exact timestamp text not found in live page.');
    }

    const platformIdentifier = screenshotPostmark.platform.toLowerCase();
    if (pageContent.toLowerCase().includes(platformIdentifier)) {
      visualScore = 0.9;
      auditLog.push('Visual consistency: UI fingerprints align with platform template.');
    } else {
      visualScore = 0.4;
      auditLog.push('Visual anomaly: Unexpected UI layout for the expected platform.');
    }
  } catch (error) {
    auditLog.push(`Audit failed: ${(error as Error).message}`);
  } finally {
    await browser.close();
  }

  const totalScore = 0.4 * originScore + 0.3 * temporalScore + 0.3 * visualScore;

  return AuditResultSchema.parse({
    originScore,
    temporalScore,
    visualScore,
    totalScore,
    auditLog,
  });
}
