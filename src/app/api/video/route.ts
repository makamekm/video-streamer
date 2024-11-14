import ffmpeg from "fluent-ffmpeg"
import { Readable, Transform } from "node:stream"
import { type NextRequest, NextResponse } from 'next/server';
import { getS3 } from '@/app/api/storage';
import { normalizePath } from '@/app/api/path-utils';

function toTime(totalSeconds?: number | null) {
  totalSeconds = totalSeconds ?? 0;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return [hours, minutes, seconds]
    .map(v => v < 10 ? "0" + v : v)
    .join(":");
}
 
export async function GET(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get('bucket') ?? process.env.STORAGE_BUCKET;
  const path = normalizePath(req.nextUrl.searchParams.get('path') ?? '');
  const seek = Number.parseFloat(req.nextUrl.searchParams.get('seek') ?? '0') || 0;
  
  if (!bucket) {
    return Response.json(
      { success: false, message: 'no bucket' },
      { status: 404 },
    );
  }
  
  if (!path) {
    return Response.json(
      { success: false, message: 'no path' },
      { status: 404 },
    );
  }

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
console.log(toTime(seek));

    const command = ffmpeg({
      logger: console,
    })
      .input(inputStream)
      .output(stream, { end: true })
      .outputFormat('mp4')
      .seek(toTime(seek))
      // .seekOutput(toTime(seek))
      .outputOptions(["-c:v", "libx264", "-pix_fmt", "yuv420p", '-movflags', 'isml+frag_keyframe'])
      .on('start', (commandLine) => {
        console.log('Spawned Ffmpeg with command: ' + commandLine);
      })
      .on('error', (err) => {
        console.error('Error:', err.message);
        console.error(err);
        stream.destroy(err);
      })
      .on('progress', (progress) => {
        // console.log(JSON.stringify(progress, null, 2));
      })
      .on('end', () => {
        // console.log('Transcoding finished');
      });

    command.run();

    (cmd.Body as any).on("error", () => {
      try {
        command?.kill("1");
      } catch (error) {
        //
      }
    }).on("end", () => {
      try {
        command?.kill("1");
      } catch (error) {
        //
      }
    });
  
    const headers = new Headers();
    
    headers.set("Content-Type", "video/mp4");
    
    return new NextResponse(stream as any, {
      status: 200,
      statusText: "OK",
      headers,
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error?.toString() },
      { status: 404 },
    );
  }
}