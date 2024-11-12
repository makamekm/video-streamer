import { type NextRequest } from 'next/server';
import * as mime from 'mime-types';
import { getS3 } from '../storage';
import { normalizePath } from '../path-utils';

export async function POST(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get('bucket');
  const path = normalizePath(req.nextUrl.searchParams.get('path') ?? '');
  const body = await req.text() || '';
  
  if (!bucket) {
    return Response.json(
      { success: false, message: 'no bucket' },
      { status: 404 },
    );
  }
  
  if (!path) {
    return Response.json(
      { success: false, message: 'no path' },
      { status: 404 },
    );
  }

  const s3 = await getS3();

  try {
    await s3.putObject({
      Bucket: bucket!,
      Key: path,
      ContentType: mime.lookup(path) || undefined,
      Body: body!,
    });
    
    return Response.json(
      { success: true },
      {
        status: 200,
        statusText: "OK",
      },
    );
  } catch (error) {
    return Response.json(
      { success: false, message: error?.toString() },
      { status: 404 },
    );
  }
}