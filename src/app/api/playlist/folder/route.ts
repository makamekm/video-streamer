import { type NextRequest } from 'next/server';
import * as mime from 'mime-types';
import { PlaylistState } from '@/app/state';
import { getStorage } from '@/app/api/storage';

function rnd() {
  return (Math.random() * 1000000).toFixed().toString();
}

export async function POST(req: NextRequest) {
  const path = 'playlist.json';
  const body = await req.json() ?? {};

  const storage = await getStorage();

  try {
    const state = await storage.readJSON<PlaylistState>(path, {});

    const videos = await storage.glob(body.path);

    state.playlists = state.playlists ?? [];
    console.log(videos);

    state.playlists.push({
      id: rnd(),
      name: body.name ?? '',
      items: videos.map(file => ({
        id: rnd(),
        key: file,
        type: 'file',
      }))
    });

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