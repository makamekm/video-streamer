import 'dotenv/config';

import ffmpeg from "fluent-ffmpeg"
const { StreamInput } = require('fluent-ffmpeg-multistream')
import { Readable, Transform } from "node:stream"
import { launch, getStream } from "puppeteer-stream";
import { executablePath } from "puppeteer";
import { resolve } from 'path';
import { createWriteStream } from "fs";
import { getS3 } from "../../app/api/storage";

async function run() {
    if (process.env.A) {
        const bucket = "stream-video";
        const path = "videos/Голый пистолет (The Naked Gun - From the Files of Police Squad!) HDRip-AVC [by ale_x2008].mkv";

        const s3 = await getS3();
        const cmd = await s3.getObject({
            Bucket: bucket!,
            Key: path,
        });
        const inputWebStream = cmd.Body?.transformToWebStream();
        const inputStream = Readable.fromWeb(inputWebStream as any);

        const command1 = ffmpeg()
            .input(inputStream)
            .inputOption(['-re'])
            // .output("rtmp://vsuc.okcdn.ru/input/910019655595_910019655595_71_c5apktm7hy")
            .output("rtmp://localhost:1935/a", { end: true })
            .outputFormat('flv')
            .outputOptions(['-c:v', 'h264', '-b:v', '5000k', '-framerate', '30', '-maxrate', '5000k', '-bufsize', '6000k', '-g', '50', '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100', '-threads', '0', '-s', '1600x900', '-preset', 'ultrafast', '-tune', 'zerolatency', '-movflags', 'frag_keyframe+empty_moov', '-flvflags', 'no_duration_filesize'])
            .on('start', (commandLine) => {
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('error', (err) => {
                console.error('Error:', err.message);
                console.error(err);
            })
            .on('progress', (progress) => {
                console.log(progress.timemark);
            })
            .on('end', () => {
                console.log("end!");
            });

        command1.run();
    }

    if (process.env.B) {
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
            // args: ['--enable-gpu', '--no-sandbox'],
            args: ['--no-sandbox'],
        });

        const page = await browser.newPage();
        // await page.goto("http://localhost:3000/stream");
        await page.goto("http://localhost:3000/");
        const webStream = await getStream(page, { audio: true, video: true });

        // const file = createWriteStream(resolve("./test.webm"));

        // stream.pipe(file);
        // npm run build && npm run start
        // const command = ffmpeg()
        //     .input(stream)
        //     .inputOption(['-re'])
        //     .output("rtmp://vsuc.okcdn.ru/input/910019655595_910019655595_71_c5apktm7hy")
        //     .outputFormat('flv')
        //     .outputOptions(['-c:v', 'h264', '-preset', 'veryfast', '-b:v', '8000k', '-framerate', '30'])
        //     .on('start', (commandLine) => {
        //         console.log('Spawned Ffmpeg with command: ' + commandLine);
        //     })
        //     .on('error', (err) => {
        //         console.error('Error:', err.message);
        //         console.error(err);
        //         stream.destroy(err);
        //     })
        //     .on('progress', (progress) => {
        //         // console.log(JSON.stringify(progress, null, 2));
        //     })
        //     .on('end', () => {
        //         // console.log('Transcoding finished');
        //     });

        // command.run();

        // const stream = new Transform({
        //     transform(chunk, _encoding, callback) {
        //         this.push(chunk);
        //         callback();
        //     },
        // });

        const command2 = ffmpeg()
            .input(webStream)
            .inputOption(['-re'])
            // .output("rtmp://vsuc.okcdn.ru/input/910019655595_910019655595_71_c5apktm7hy")
            .output("rtmp://localhost:1935/b")
            // .videoCodec('libx264')
            // .size('1600x900')
            // .flvmeta()
            .format('flv')
            // .inputFPS(25)
            // .videoBitrate('900k')
            // .audioCodec('libmp3lame')
            // .audioBitrate(128)
            // .addInputOption('-f gdigrab')
            // .addInputOption('-f dshow')
            // .addInputOption('-i video="screen-capture-recorder"')
            // .addInputOption('-c:a aac')
            // .addInputOption('-ar 44100')libvpx -pix_fmt yuva420p
            .outputOptions(['-c:v', 'libx264', '-pix_fmt', 'yuva420p', '-b:v', '5000k', '-framerate', '30', '-maxrate', '5000k', '-bufsize', '6000k', '-g', '50', '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '44100', '-threads', '0', '-s', '1600x900', '-preset', 'ultrafast', '-tune', 'zerolatency', '-movflags', 'frag_keyframe+empty_moov', '-flvflags', 'no_duration_filesize'])
            // .outputOptions(['-c:v', 'h264', '-preset', 'veryfast', '-b:v', '8000k', '-framerate', '30'])
            .on('start', (commandLine) => {
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('error', (err) => {
                console.error('Error:', err.message);
                console.error(err);
                webStream?.destroy();
            })
            .on('progress', async (progress) => {
                console.log(progress.timemark, await page.title());
            })
            .on('end', () => {
                console.log("end!");
            });

        command2.run();
    }

    // ffmpeg -re -i "rtmp://localhost:1935/a" -i "rtmp://localhost:1935/b" -f flv -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1" -vsync vfr -b:v 5000k -framerate 30 -maxrate 5000k -bufsize 6000k -g 50 -c:a aac -b:a 128k -ac 2 -ar 44100 -threads 0 -s 1600x900 -c:v h264 -preset ultrafast -tune zerolatency -movflags frag_keyframe+empty_moov -flvflags no_duration_filesize "rtmp://localhost:1935/c"
    // ffmpeg -re -i "http://localhost:3002/a/index.m3u8" -i "http://localhost:3002/b/index.m3u8" -f flv -filter_complex "overlay" -b:v 5000k -framerate 30 -maxrate 5000k -bufsize 6000k -g 50 -c:a aac -b:a 128k -ac 2 -ar 44100 -threads 0 -s 1600x900 -c:v h264 -preset ultrafast -tune zerolatency -movflags frag_keyframe+empty_moov -flvflags no_duration_filesize "rtmp://vsuc.okcdn.ru/input/910019655595_910019655595_71_c5apktm7hy"

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