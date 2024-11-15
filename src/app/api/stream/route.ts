import { launch, getStream } from "puppeteer-stream";
// import { launch } from "puppeteer";
import { type NextRequest } from 'next/server';
import * as mime from 'mime-types';
const wildcard = require('wildcard');
import { join, resolve } from 'path';
import { createWriteStream } from "fs";

// curl -X POST -H "Content-Type: application/json" -d '{}' http://localhost:3000/api/torrent/load
export async function POST(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get('bucket') ?? process.env.STORAGE_BUCKET;
  const body = await req.json() ?? {};

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

  const browser = await launch({
    // executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    // executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    // or on linux: "google-chrome-stable"
    // or on mac: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    headless: "new",
    channel: 'chrome',
    userDataDir: resolve("./tmp/chrome" + (Math.random() * 1000000).toFixed()),
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    // extensionPath: resolve("./tmp/chrome-ext"),
  });

  const page = await browser.newPage();
  await page.goto("http://localhost:3000/stream");
  const stream = await getStream(page, { audio: true, video: true });

  const file = createWriteStream(resolve("./test.webm"));

  stream.pipe(file);

  const start = async () => {
    await stream.destroy();
    file.close();

    console.log("finished");

    await browser.close();
    controller?.close();
    controller = null;
  };

  setTimeout(start, 1000 * 5);

  const watch = async () => {
    while(true) {
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