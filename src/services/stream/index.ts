import ffmpeg from "fluent-ffmpeg"
import { launch, getStream } from "puppeteer-stream";
import { executablePath } from "puppeteer";
import { resolve } from 'path';
import { createWriteStream } from "fs";

async function run() {
    const browser = await launch({
        executablePath: executablePath(),
        headless: "new",
        userDataDir: resolve("./tmp/chrome_" + (Math.random() * 1_000_000).toFixed()),
        defaultViewport: {
            // width: 640,
            // height: 480,
            // width: 1920,
            // height: 1080,
            width: 1600,
            height: 900,
        },
        args: ['--enable-gpu', '--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto("http://localhost:3000/stream");
    const stream = await getStream(page, { audio: true, video: true });

    // const file = createWriteStream(resolve("./test.webm"));

    // stream.pipe(file);
    // npm run build && npm run start
    const command = ffmpeg()
        .input(stream)
        .inputOption(['-re'])
        .output("rtmp://vsuc.okcdn.ru/input/910019655595_910019655595_71_c5apktm7hy")
        .outputFormat('flv')
        .outputOptions(['-c:v', 'h264', '-preset', 'veryfast', '-b:v', '8000k', '-framerate', '30', '-s', '1600x900'])
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

    // const start = async () => {
    //     await stream.destroy();
    //     file.close();

    //     console.log("finished");

    //     await browser.close();
    //     process.exit(0);
    // };

    // setTimeout(start, 1000 * 10);
}

run();