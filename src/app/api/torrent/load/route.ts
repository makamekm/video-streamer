import { type NextRequest } from 'next/server';
import * as mime from 'mime-types';
import torrentStream from 'torrent-stream';
const wildcard = require('wildcard');
import prettyBytes from 'pretty-bytes';
// import { uploadS3 } from '@/app/api/storage';
import { join, resolve } from 'path';
import { Readable } from 'stream';
import { getStorage } from '../../storage';

// curl -X POST -H "Content-Type: application/json" -d '{}' http://localhost:3000/api/torrent/load
export async function POST(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get('bucket') ?? process.env.STORAGE_BUCKET;
  const body = await req.json() ?? {};
  const path = body.path ?? 'videos';

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
    controller?.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
  }

  let engine: TorrentStream.TorrentEngine | null = torrentStream(
    // 'magnet:?xt=urn:btih:E1894EBB466DF3400EFB3E7DEC508D78BE973C14&tr=http%3A%2F%2Fbt2.t-ru.org%2Fann%3Fmagnet&dn=%D0%93%D0%BE%D0%BB%D1%8B%D0%B9%20%D0%9F%D0%B8%D1%81%D1%82%D0%BE%D0%BB%D0%B5%D1%82%3A%20%D0%98%D0%B7%20%D0%90%D1%80%D1%85%D0%B8%D0%B2%D0%BE%D0%B2%20%D0%9F%D0%BE%D0%BB%D0%B8%D1%86%D0%B8%D0%B8!%20%2F%20The%20Naked%20Gun%3A%20From%20the%20Files%20of%20Police%20Squad!%20(%D0%94%D1%8D%D0%B2%D0%B8%D0%B4%20%D0%A6%D1%83%D0%BA%D0%B5%D1%80%20%2F%20David%20Zucker)%20%5B1988%2C%20%D0%A1%D0%A8%D0%90%2C%20%D0%BA%D0%BE%D0%BC%D0%B5%D0%B4%D0%B8%D1%8F%2C%20HDRip-AVC%5D%20VO%20(',
    body.magnet,
    {
      tmp: resolve(process.env.TMP_FOLDER ?? './torrent-tmp'),
    },
  );

  const isIncluded = (path: string) => {
    let good = path.endsWith('.mkv') || path.endsWith('.avi') || path.endsWith('.mp4') || path.endsWith('.mov') || path.endsWith('.avi');

    if (good) {
      for (const pattern of body.wildcards ?? []) {
        good = good || wildcard(pattern, path);
      }
    }

    return good;
  }

  const getFiles = () => engine?.files.filter((file) => isIncluded(file.path)) ?? [];

  const emitFiles = async () => {
    getFiles().forEach((file: any) => {
      const fileStart = file.offset;
      const fileEnd = file.offset + file.length;
      const pieceLength = (engine as any).torrent.pieceLength;
      const firstPiece = Math.floor(fileStart / pieceLength);
      const lastPiece = Math.floor((fileEnd - 1) / pieceLength);

      const file_pieces_progess = Array.from((engine as any).bitfield.buffer)
        .map((n: any) => n.toString(2).padStart(8, "0"))
        .join("")
        .split("")
        .slice(firstPiece, lastPiece - firstPiece);

      const downloaded = file_pieces_progess.filter(n => Number(n) === 1)
        .length;
      const downloadedTotal = lastPiece - firstPiece;

      emit({
        type: 'file',
        path: join(path, file.path),
        length: file.length,
        size: prettyBytes(file.length),
        downloaded: downloaded,
        downloadedTotal: downloadedTotal,
        downloadSpeed: `${prettyBytes((engine as any).swarm.downloadSpeed())}/s`,
        downloadPercent: `${(downloaded / downloadedTotal * 100).toPrecision(2)}%`,
        uploadSpeed: `${prettyBytes((engine as any).swarm.uploadSpeed())}/s`,
      });
    });
  }

  const promise = new Promise<void>(r => {
    req.signal.addEventListener('abort', () => {
      engine?.destroy(() => { });
      engine = null;
      r();
    });

    engine?.on('idle', emitFiles);
    engine?.on('download', emitFiles);
    engine?.on('upload', emitFiles);

    engine?.on('ready', async () => {
      engine?.files.forEach((file) => {
        if (isIncluded(file.path)) {
          file.select();
        } else {
          file.deselect();
        }
      }) ?? [];

      const files = getFiles();

      files.forEach(file => {
        emit({
          type: 'file',
          path: join(path, file.path),
          length: file.length,
          size: prettyBytes(file.length),
        });
      });

      const storage = await getStorage();

      await Promise.all(files.map(async file => {
        const stream: Readable = file.createReadStream();

        await storage.write(join(path, file.path), stream);

        // await uploadS3({
        //   Bucket: bucket,
        //   Key: join(path, file.path),
        //   ContentType: mime.lookup(file.name) || undefined,
        //   Body: stream,
        // }, (progress) => {
        //   emit({
        //     type: 'file',
        //     path: join(path, file.path),
        //     length: file.length,
        //     size: prettyBytes(file.length),
        //     uploaded: progress.loaded,
        //     uploadedTotal: progress.total,
        //     uploadedPercent: `${((progress.loaded ?? 0) / (progress.total ?? 1) * 100).toPrecision(2)}%`,
        //     uploadSpeed: `${prettyBytes((engine as any).swarm.uploadSpeed())}/s`,
        //   });
        // })
      }) ?? []);

      engine?.destroy(() => { });
      r();
    });
  });

  const watch = async () => {
    while (true) {
      emit({
        type: 'ping',
      });
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