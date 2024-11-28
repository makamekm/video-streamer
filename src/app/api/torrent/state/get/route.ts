import { type NextRequest } from 'next/server';
import { TorrentState } from '@/app/state';
import { getStorage } from '@/app/api/storage';

// Prevents this route's response from being cached on Vercel
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get('bucket') ?? process.env.STORAGE_BUCKET;
  const path = 'torrent.json';

  const storage = await getStorage();

  // Obtain the conversation messages from request's body
  // const { messages = [] } = await request.json();
  const encoder = new TextEncoder();

  let controller: ReadableStreamDefaultController<any> | null;

  const watch = async () => {
    while (true) {
      const json = await storage.readJSON<TorrentState>(path, {

      });
      controller?.enqueue(encoder.encode(JSON.stringify(json) + '\n'));
      if (!controller) break;
      await new Promise(r => setTimeout(r, 2000));
    }
  };

  // Create a streaming response
  const customReadable = new ReadableStream({
    async start(_controller) {
      controller = _controller;
      watch();
    },
    cancel() {
      controller = null;
    }
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
