import { type NextRequest } from 'next/server';
import * as mime from 'mime-types';
import { State } from '@/app/state';
import { getStorage } from '@/app/api/storage';

export async function POST(req: NextRequest) {
  const path = 'state.json';
  const body = await req.json() ?? {};

  const storage = await getStorage();

  try {
    const json = await storage.readJSON<State>(path, {});
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