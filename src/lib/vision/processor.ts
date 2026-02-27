import sharp from 'sharp';

export interface PreprocessingOptions {
  contrast?: number;
  brightness?: number;
  sharpen?: boolean;
}

/**
 * Preprocess image for better OCR results.
 * Deskewing is not natively supported by sharp but we can use rotate if needed.
 * For now, focus on contrast and sharpness.
 */
export async function preprocessImage(imageBuffer: Buffer, options: PreprocessingOptions = {}): Promise<Buffer> {
  let pipeline = sharp(imageBuffer);

  if (options.contrast !== undefined) {
    pipeline = pipeline.linear(options.contrast, -(128 * options.contrast) + 128);
  }

  if (options.brightness !== undefined) {
    pipeline = pipeline.modulate({ brightness: options.brightness });
  }

  if (options.sharpen) {
    pipeline = pipeline.sharpen();
  }

  return await pipeline.toBuffer();
}
