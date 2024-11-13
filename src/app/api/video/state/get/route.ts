import { type NextRequest } from 'next/server';
import { State } from '@/app/state';
import { nextVideo, readJSON, saveJSON } from '@/app/api/read';

// Prevents this route's response from being cached on Vercel
export const dynamic = "force-dynamic";
 
export async function POST(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get('bucket') ?? process.env.STORAGE_BUCKET;
  const pathState = 'state.json';

  // Obtain the conversation messages from request's body
  // const { messages = [] } = await request.json();
  const encoder = new TextEncoder();

  let controller: ReadableStreamDefaultController<any> | null;

  const watch = async () => {
    while(true) {
      let json = await readJSON<State>(pathState, {
        events: [],
        played: [],
        playlist: [],
        current: undefined,
      }, bucket);

      json = await nextVideo(json);

      controller?.enqueue(encoder.encode(JSON.stringify(json)));
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
