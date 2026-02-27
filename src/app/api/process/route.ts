import { NextRequest, NextResponse } from 'next/server';
import { processPostcard } from '@/lib/postcard';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const report = await processPostcard(buffer);
    
    return NextResponse.json(report);
  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
