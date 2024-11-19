import * as mime from 'mime-types';
import { type NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/app/api/storage';
import { normalizePath } from '@/app/api/path-utils';

export async function GET(req: NextRequest) {
  const path = normalizePath(req.nextUrl.searchParams.get('path') ?? '');

  if (!path) {
    return Response.json(
      { success: false, message: 'no path' },
      { status: 404 },
    );
  }

  const storage = await getStorage();

  try {
    const stream = await storage.read(path);

    const headers = new Headers();

    const meme = mime.lookup(path)
    if (meme) headers.set("Content-Type", meme);
    // if (cmd.LastModified) headers.set("Last-Modified", cmd.LastModified.toString());
    // if (cmd.ContentLength) headers.set("Content-Length", cmd.ContentLength.toString());

    return new NextResponse(stream as any, {
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
