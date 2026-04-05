import sharp from "sharp";

export interface PreprocessingOptions {
  contrast?: number;
  brightness?: number;
  sharpen?: boolean;
}

export async function preprocessImage(
  imageBuffer: Buffer,
  options: PreprocessingOptions = {},
): Promise<Buffer> {
  // Resize to max 1024px on either axis before any other ops — reduces input
  // token count significantly without losing OCR-relevant detail.
  let pipeline = sharp(imageBuffer).resize(1024, 1024, {
    fit: "inside",
    withoutEnlargement: true,
  });

  if (options.contrast !== undefined) {
    pipeline = pipeline.linear(
      options.contrast,
      -(128 * options.contrast) + 128,
    );
  }

  if (options.brightness !== undefined) {
    pipeline = pipeline.modulate({ brightness: options.brightness });
  }

  if (options.sharpen) {
    pipeline = pipeline.sharpen();
  }

  return await pipeline.toBuffer();
}
