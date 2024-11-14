import { type NextRequest } from 'next/server';
import { State } from '@/app/state';
import { nextVideo, readJSON, saveJSON } from '@/app/api/read';
 
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

  try {
    let state = await readJSON<State>(path, {
      events: [],
      played: [],
    }, bucket);

    state = await nextVideo(state, bucket, {
      finish: true,
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