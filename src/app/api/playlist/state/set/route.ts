import { type NextRequest } from 'next/server';
import * as mime from 'mime-types';
import { PlaylistState } from '@/app/state';
import { getS3 } from '@/app/api/storage';
import { readJSON } from '@/app/api/read';

export async function POST(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get('bucket') ?? process.env.STORAGE_BUCKET;
  const path = 'playlist.json';
  const body = await req.json() ?? {};

  if (!bucket) {
    return Response.json(
      { success: false, message: 'no bucket' },
      { status: 404 },
    );
  }

  const s3 = await getS3();

  try {
    const json = await readJSON<PlaylistState>(path, {}, bucket);
    const state = {
      ...json,
      ...body,
    };

    await s3.putObject({
      Bucket: bucket,
      Key: path,
      ContentType: mime.lookup(path) || undefined,
      Body: JSON.stringify(state),
    });
    
    return Response.json(
      state,
      {
        status: 200,
        statusText: "OK",
      },
    );
  } catch (error) {
    return Response.json(
      { success: false, message: error?.toString() },
      { status: 500 },
    );
  }
}