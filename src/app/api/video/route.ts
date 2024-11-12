import ffmpeg from "fluent-ffmpeg"
import { Readable, Transform } from "node:stream"
import { type NextRequest, NextResponse } from 'next/server';
import { getS3 } from '../s3/storage';
import { normalizePath } from '../s3/path-utils';
 
export async function GET(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get('bucket') ?? process.env.STORAGE_BUCKET;
  const path = normalizePath(req.nextUrl.searchParams.get('path') ?? '');
  
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

    const command = ffmpeg({
      logger: console,
    })
      .input(inputStream)
      .output(stream, { end: true })
      .outputFormat('mp4')
      // .seekInput("00:23:00")
      .outputOptions(["-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", '-movflags', 'isml+frag_keyframe'])
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
      command.kill("0");
    }).on("end", () => {
      command.kill("0");
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