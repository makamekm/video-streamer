import { type NextRequest, NextResponse } from 'next/server';
import { getS3 } from '@/app/api/storage';
import { normalizePath } from '@/app/api/path-utils';
 
export async function GET(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get('bucket') ?? process.env.STORAGE_BUCKET;
  const path = normalizePath(req.nextUrl.searchParams.get('path') ?? '');
  
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
    const cmd = await s3.getObject({
      Bucket: bucket!,
      Key: path,
    });
  
    const headers = new Headers();
  
    if (cmd.ContentType) headers.set("Content-Type", cmd.ContentType.toString());
    if (cmd.LastModified) headers.set("Last-Modified", cmd.LastModified.toString());
    if (cmd.ContentLength) headers.set("Content-Length", cmd.ContentLength.toString());
    
    return new NextResponse(cmd.Body?.transformToWebStream(), {
      status: 200,
      statusText: "OK",
      headers,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error?.toString() },
      { status: 404 },
    );
  }
}