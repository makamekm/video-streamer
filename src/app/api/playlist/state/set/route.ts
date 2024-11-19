import { type NextRequest } from 'next/server';
import * as mime from 'mime-types';
import { PlaylistState } from '@/app/state';
import { getStorage } from '@/app/api/storage';

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

  const storage = await getStorage();

  try {
    const json = await storage.readJSON<PlaylistState>(path, {});
    const state = {
      ...json,
      ...body,
    };

    await storage.writeJSON(path, state);

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