import ffmpeg from "fluent-ffmpeg"
import { Readable, Transform } from "node:stream"
import { type NextRequest } from 'next/server';
import { normalizePath } from '@/app/api/path-utils';
import { getStorage } from "@/app/api/storage";

export async function POST(req: NextRequest) {
  const path = normalizePath(req.nextUrl.searchParams.get('path') ?? '');

  const storage = await getStorage();

  try {
    const inputStream = await storage.read(path!);

    const meta: ffmpeg.FfprobeFormat = await new Promise((r, e) => {
      ffmpeg(inputStream)
        .ffprobe((err, data) => {
          if (err) {
            e(err);
          } else {
            r(data.format);
          }
        });
    });

    return Response.json(
      {
        duration: meta.duration,
      },
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
