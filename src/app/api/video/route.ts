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

    // const meta: ffmpeg.FfprobeFormat = await new Promise((r, e) => {
    //   ffmpeg(inputStream)
    //     .ffprobe((err, data) => {
    //       if (err) {
    //         e(err);
    //       } else {
    //         r(data.format);
    //       }
    //     });
    // });
    // curl "https://test.rulet.pl/api/video?id=209660&path=videos/%D0%93%D0%BE%D0%BB%D1%8B%D0%B9%20%D0%BF%D0%B8%D1%81%D1%82%D0%BE%D0%BB%D0%B5%D1%82%20(The%20Naked%20Gun%20-%20From%20the%20Files%20of%20Police%20Squad!)%20HDRip-AVC%20[by%20ale_x2008].mkv&seek=227.772619&counter=0"

    const command = ffmpeg()
      .input(inputStream)
      .inputOption(['-re'])
      // .output(stream, { end: true })
      // .output("rtmp://vsuc.okcdn.ru/input/910019655595_910019655595_71_c5apktm7hy")
      .output("rtmp://localhost:1935/sdfsdf")
      // .output("http://localhost:8888/sdfsdf/index.m3u8")
      // .outputFormat('flv')
      // .outputOptions(['-movflags', 'isml+frag_keyframe', '-b:v', '8M'])
      // .output(stream)
      // .outputFormat('hls')
      .outputFormat('flv')
      // .outputFormat('mp4')
      .seek(toTime(seek))
      // .seekOutput(toTime(seek))
      // .outputOptions(["-c:v", "libx264", "-pix_fmt", "yuv420p", '-movflags', 'isml+frag_keyframe'])
      .outputOptions(['-c:v', 'h264', '-preset', 'veryfast', '-b:v', '5000k', '-framerate', '30', '-maxrate', '5000k', '-bufsize', '6000k', '-g', '50', '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100', '-threads', '0', '-s', '1600x900'])
      // .outputOptions(['-movflags', 'faststart', '-b:v', '1M', '-b:a', '1M'])
      // .outputOptions(['-c:v', 'libx264', '-preset veryfast', '-movflags', 'isml+frag_keyframe', '-b:v', '8M', '-hls_time', '4', '-hls_playlist_type', 'event'])
      // .outputOptions(['-b:v', '1M', '-b:a', '1M'])
      // .outputOptions(['-movflags', 'isml+frag_keyframe'])
      // .outputOptions(['-movflags', 'isml+frag_keyframe', '-b:v', '8M', '-vf', 'scale=1280:720'])
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

    req.signal.addEventListener('abort', () => {
      try {
        command?.kill("1");
      } catch (error) {
        //
      }
    });

    const headers = new Headers();

    // headers.set("Content-Type", "application/vnd.apple.mpegurl");
    // headers.set("Content-Type", "application/mp4");

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