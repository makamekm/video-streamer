import { type NextRequest } from 'next/server';
import { State } from '@/app/state';
import { nextVideo } from '@/app/api/read';
import { getStorage } from '@/app/api/storage';

export async function POST(req: NextRequest) {
  const path = 'state.json';

  const storage = await getStorage();
  try {
    let state = await storage.readJSON<State>(path, {
      events: [],
      played: [],
    });

    state = await nextVideo(state, storage, {
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