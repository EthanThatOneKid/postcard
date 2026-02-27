import { preprocessImage } from './vision/processor';
import { extractPostmark, OCRResult } from './vision/ocr';
import { navigatorAgent } from './agents/navigator';
import { auditPostmark, AuditResult } from './agents/verifier';

export interface PostcardReport {
  ocr: OCRResult;
  triangulation: {
    targetUrl?: string;
    queries: string[];
  };
  audit: AuditResult;
  timestamp: string;
}

/**
 * The main "Digital Pathologist" pipeline.
 */
export async function processPostcard(imageBuffer: Buffer): Promise<PostcardReport> {
  // 1. Preprocess
  const processed = await preprocessImage(imageBuffer, { contrast: 1.2, sharpen: true });
  
  // 2. Extract OCR & Postmark
  const ocr = await extractPostmark(processed);
  
  // 3. Triangulate URL (Navigator Agent)
  const navResult = await navigatorAgent.invoke({
    postmark: ocr.postmark,
    markdown: ocr.markdown
  });
  
  const targetUrl = navResult.identifiedUrl;
  
  // 4. Audit Postmark (Forensic Verifier)
  let audit: AuditResult = {
    originScore: 0,
    temporalScore: 0,
    visualScore: 0,
    totalScore: 0,
    auditLog: ['Skipping audit: No target URL identified.']
  };
  
  if (targetUrl) {
    audit = await auditPostmark(targetUrl, ocr.postmark);
  }
  
  return {
    ocr,
    triangulation: {
      targetUrl,
      queries: navResult.queries
    },
    audit,
    timestamp: new Date().toISOString()
  };
}
