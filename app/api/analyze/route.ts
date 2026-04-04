import { NextRequest, NextResponse } from 'next/server';
import { processPostcard } from '@/src/lib/postcard';

// Playwright requires the Node.js runtime — cannot run on Edge
export const runtime = 'nodejs';

// Allow up to 60 s for the full pipeline (OCR + search + Playwright audit)
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── Parse multipart/form-data ──────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Could not parse form data. Send a multipart/form-data request.' },
      { status: 400 },
    );
  }

  const file = formData.get('image');

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: 'Missing required field "image". Attach an image file with field name "image".' },
      { status: 400 },
    );
  }

  // Validate MIME type before spending API credits
  const mimeType = file instanceof File ? file.type : 'image/png';
  const supported = ['image/jpeg', 'image/png', 'image/webp'];
  if (!supported.includes(mimeType)) {
    return NextResponse.json(
      { error: `Unsupported image type "${mimeType}". Accepted: ${supported.join(', ')}.` },
      { status: 400 },
    );
  }

  // ── Convert Blob → Buffer ──────────────────────────────────────
  const arrayBuffer = await file.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  // ── Run the forensic pipeline ──────────────────────────────────
  try {
    const report = await processPostcard(imageBuffer, mimeType);
    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pipeline failed unexpectedly.';
    console.error('[postcard] pipeline error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
