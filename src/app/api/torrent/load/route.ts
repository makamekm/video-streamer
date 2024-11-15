import { type NextRequest } from 'next/server';
import * as mime from 'mime-types';
import torrentStream from 'torrent-stream';
// import wildcard from 'wildcard';
// import TorrentStream from 'torrent-stream';
import { TorrentState } from '@/app/state';
import { uploadS3 } from '@/app/api/storage';
import { readJSON } from '@/app/api/read';
import { join } from 'path';
import { Readable } from 'stream';

// curl -X POST -H "Content-Type: application/json" -d '{}' http://localhost:3000/api/torrent/load
export async function POST(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get('bucket') ?? process.env.STORAGE_BUCKET;
  const path = 'videos/test';
  // const body = await req.json() ?? {};

  if (!bucket) {
    return Response.json(
      { success: false, message: 'no bucket' },
      { status: 404 },
    );
  }

  // Obtain the conversation messages from request's body
  // const { messages = [] } = await request.json();
  const encoder = new TextEncoder();

  let controller: ReadableStreamDefaultController<any> | null;
  const emit = (data: any) => {
    controller?.enqueue(encoder.encode(JSON.stringify(data)));
  }

  let engine: TorrentStream.TorrentEngine | null = torrentStream('magnet:?xt=urn:btih:E1894EBB466DF3400EFB3E7DEC508D78BE973C14&tr=http%3A%2F%2Fbt2.t-ru.org%2Fann%3Fmagnet&dn=%D0%93%D0%BE%D0%BB%D1%8B%D0%B9%20%D0%9F%D0%B8%D1%81%D1%82%D0%BE%D0%BB%D0%B5%D1%82%3A%20%D0%98%D0%B7%20%D0%90%D1%80%D1%85%D0%B8%D0%B2%D0%BE%D0%B2%20%D0%9F%D0%BE%D0%BB%D0%B8%D1%86%D0%B8%D0%B8!%20%2F%20The%20Naked%20Gun%3A%20From%20the%20Files%20of%20Police%20Squad!%20(%D0%94%D1%8D%D0%B2%D0%B8%D0%B4%20%D0%A6%D1%83%D0%BA%D0%B5%D1%80%20%2F%20David%20Zucker)%20%5B1988%2C%20%D0%A1%D0%A8%D0%90%2C%20%D0%BA%D0%BE%D0%BC%D0%B5%D0%B4%D0%B8%D1%8F%2C%20HDRip-AVC%5D%20VO%20(');

  const promise = new Promise<void>(r => {
    req.signal.addEventListener('abort', () => {
      engine?.destroy(() => {});
      engine = null;
      r();
    });

    engine?.on('idle', () => {
      console.log("FINISHED!");
      emit({
        status: 'files',
        viles: engine?.files.map(file => ({
          name: file.name,
          path: file.path,
          length: file.length,
        })) ?? [],
      });
      emit({
        status: "done",
      });
    });

    engine?.on('download', async (chunks) => {
      console.log("PROGRESS", chunks);
      emit({
        status: "torrent-progress",
        chunks: chunks,
      });
    });

    engine?.on('ready', async () => {
      const files = engine?.files.filter((file) => {
        const good = file.name.endsWith('.mkv') || file.name.endsWith('.avi') || file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.avi');

        if (good) {
          file.select();
        } else {
          file.deselect();
        }

        return good;
      }) ?? [];

      emit({
        status: 'files',
        viles: files.map(file => ({
          name: file.name,
          path: file.path,
          length: file.length,
        })),
      });

      await Promise.all(files.map(async file => {
        const stream: Readable = file.createReadStream();

        await uploadS3({
          Bucket: bucket,
          Key: join(path, file.path),
          ContentType: mime.lookup(file.name) || undefined,
          Body: stream,
        }, (progress) => {
          emit({
            status: 'upload-progress',
            loaded: progress.loaded,
            total: progress.total,
            key: progress.Key,
            bucket: progress.Bucket,
          });
        })
      }) ?? []);

      engine?.destroy(() => {});
      r();
    });
  });

  const watch = async () => {
    while(true) {
      controller?.enqueue(encoder.encode(JSON.stringify({
        status: "ping",
      })));
      if (!controller) break;
      await new Promise(r => setTimeout(r, 3000));
    }
  };

  const customReadable = new ReadableStream({
    async start(_controller) {
      controller = _controller;
      watch();
    },
    cancel() {
      controller = null;
    },
  });

  promise.finally(() => {
    controller?.close();
    controller = null;
  });

  // Return the stream response and keep the connection alive
  return new Response(customReadable, {
    // Set the headers for Server-Sent Events (SSE)
    headers: {
      Connection: "keep-alive",
      "Content-Encoding": "none",
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/event-stream; charset=utf-8",
    },
  });
}