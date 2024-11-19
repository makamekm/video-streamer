import { type NextRequest } from 'next/server';
import { normalizePath } from '../../path-utils';
import { getStorage } from '../../storage';

export async function POST(req: NextRequest) {
  const path = normalizePath(req.nextUrl.searchParams.get('path') ?? '');
  const type = normalizePath(req.nextUrl.searchParams.get('type') ?? 'file');

  if (!path) {
    return Response.json(
      { success: false, message: 'no path' },
      { status: 404 },
    );
  }

  if (!type) {
    return Response.json(
      { success: false, message: 'no type' },
      { status: 404 },
    );
  }

  const storage = await getStorage();

  try {
    await storage.remove(path);

    return Response.json(
      { success: false, message: `not inplemented type: "${type}"` },
      {
        status: 500,
      },
    );
  } catch (error) {
    return Response.json(
      { success: false, message: error?.toString() },
      { status: 404 },
    );
  }
}