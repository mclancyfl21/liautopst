import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getCredentials } from '@/lib/credential-actions';

export async function POST(req: NextRequest) {
  try {
    const creds = await getCredentials();
    
    if (!creds.cloudinary_cloud_name || !creds.cloudinary_api_key || !creds.cloudinary_api_secret) {
      return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
    }

    cloudinary.config({
      cloud_name: creds.cloudinary_cloud_name,
      api_key: creds.cloudinary_api_key,
      api_secret: creds.cloudinary_api_secret,
    });

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResponse = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'liautopost' },
        (error, result) => {
          if (error) {
            console.error('[CLOUDINARY] Stream Error:', error);
            reject(error);
          } else if (!result) {
            console.error('[CLOUDINARY] No Result');
            reject(new Error('Upload failed: No result from Cloudinary'));
          } else {
            console.log('[CLOUDINARY] Upload Success:', result.secure_url);
            resolve(result as { secure_url: string });
          }
        }
      ).end(buffer);
    });

    return NextResponse.json({ url: uploadResponse.secure_url });
  } catch (error: unknown) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
