import { type NextRequest } from 'next/server';
import { resolve } from 'path';
import { PassThrough } from 'stream';
import { $, ProcessPromise } from 'zx';
import getPort from 'get-port';

const LOCAL_PATH = resolve('./files');

let port: number | null;
let process: ProcessPromise | null;
let signalController: AbortController | null;

export async function DELETE(req: NextRequest) {
  signalController?.abort("0");
  process?.kill();
  process = null;
  signalController = null;

  return Response.json(
    { success: true, message: 'done' },
    { status: 200 },
  );
}

// curl -X POST -H "Content-Type: application/json" -d '{}' http://localhost:3000/api/torrent/load
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  let controller: ReadableStreamDefaultController<any> | null;
  const emit = (data: any) => {
    controller?.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
  }

  signalController = signalController ?? new AbortController();

  if (!process) {
    port = await getPort({ port: 8080 });
    process = $({ signal: signalController?.signal })`filebrowser -a 0.0.0.0 -p ${port} --noauth -r ${LOCAL_PATH}`;
  }

  process.finally(() => {
    controller = null;
  });

  const stream = new PassThrough();

  process.pipe(stream);

  stream.on('data', (chunk) => {
    emit({
      log: Buffer.from(chunk).toString('utf8'),
    });
  });

  emit({
    port: port,
  });

  const watch = async () => {
    while (true) {
      if (!controller) break;
      await new Promise(r => setTimeout(r, 5000));
    }
  };

  const customReadable = new ReadableStream({
    async start(_controller) {
      controller = _controller;
      watch();
    },
    cancel() {
      // controller?.close();
      controller = null;
    },
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