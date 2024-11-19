import { type NextRequest } from 'next/server';
import * as mime from 'mime-types';
import { getStorage } from '@/app/api/storage';
import { normalizePath } from '@/app/api/path-utils';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  const path = normalizePath(req.nextUrl.searchParams.get('path') ?? '');
  const body = await req.text() || '';

  if (!path) {
    return Response.json(
      { success: false, message: 'no path' },
      { status: 404 },
    );
  }

  const storage = await getStorage();

  try {
    storage.write(path, Readable.from([body]));

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