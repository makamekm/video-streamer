import { type NextRequest } from 'next/server';
import * as mime from 'mime-types';
import { State } from '@/app/state';
import { getS3 } from '../../../s3/storage';
import { readJSON } from '../read';

// Prevents this route's response from being cached on Vercel
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get('bucket') ?? process.env.STORAGE_BUCKET;
  const path = 'state.json';
  const body = await req.json() ?? {};

  if (!bucket) {
    return Response.json(
      { success: false, message: 'no bucket' },
      { status: 404 },
    );
  }

  const s3 = await getS3();

  try {
    const json = await readJSON<State>(path, {}, bucket);
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