import ffmpeg from "fluent-ffmpeg"
import { Readable, Transform } from "node:stream"
import { type NextRequest } from 'next/server';
import { getS3 } from '@/app/api/storage';
import { normalizePath } from '@/app/api/path-utils';
 
export async function POST(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get('bucket') ?? process.env.STORAGE_BUCKET;
  const path = normalizePath(req.nextUrl.searchParams.get('path') ?? '');
  
  const s3 = await getS3();

  try {
    const cmd = await s3.getObject({
      Bucket: bucket!,
      Key: path,
    });
    const inputWebStream = cmd.Body?.transformToWebStream();
    const inputStream = Readable.fromWeb(inputWebStream as any);

    const stream = new Transform({
      transform(chunk, _encoding, callback) {
        this.push(chunk);
        callback();
      },
    });

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
