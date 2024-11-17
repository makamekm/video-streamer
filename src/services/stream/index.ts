import 'dotenv/config';

import { $ } from 'zx';
import ffmpeg from "fluent-ffmpeg";
import { PassThrough, Readable } from "node:stream";
import { launch, getStream } from "puppeteer-stream";
import { executablePath } from "puppeteer";
import { resolve } from 'path';
import { getS3 } from "../../app/api/storage";
import { nextVideo, readJSON } from '../../app/api/read';
import { State, Video } from '../../app/state';

// width: 1600,
// height: 900,
const OUT_TMP_FOLDER = 'tmp';
const OUT_TMP_FILE_STREAM = 'out.m3u8';
const OUT_TMP_STREAM = `${OUT_TMP_FOLDER}/${OUT_TMP_FILE_STREAM}`;
const OUT_TS_REGEXP = /^out\d+\.ts$/;
const S3_BUCKET = process.env.STORAGE_BUCKET;
const STATE_PATH = 'state.json';

const WIDTH = 1920;
const HEIGHT = 1080;
const VIDEO_BITRATE = '5000k';
const AUDIO_BITRATE = '128k';
const FRAMERATE = '24';

async function createWebStream(url: string) {
    const browser = await launch({
        executablePath: executablePath(),
        headless: "new",
        userDataDir: resolve(`./${OUT_TMP_FOLDER}/chrome_${(Math.random() * 1_000_000).toFixed()}`),
        defaultViewport: {
            width: WIDTH,
            height: HEIGHT,
        },
        // args: ['--enable-gpu', '--no-sandbox'],
        args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto(url);
    return await getStream(page, {
        audio: true,
        video: true,
        mimeType: 'video/webm;codecs=vp8',
        streamConfig: {
            immediateResume: true,
        },
        frameSize: 30,
    });
}

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

async function createSimpleStream(stream: Readable, onEnd?: Function, onProgress?: Function) {
    const cmd = new Promise<ffmpeg.FfmpegCommand>(async r => {
        let resolved = false;
        let command: ffmpeg.FfmpegCommand;

        command = ffmpeg()
            .input(stream)
            .inputOption(['-re'])
            .format('hls')
            .output(OUT_TMP_STREAM, { end: false })
            .addOutputOptions([
                '-c:v',
                'libx264',
                '-preset',
                'ultrafast',
                '-tune',
                'zerolatency',
                '-movflags',
                'isml+frag_keyframe+empty_moov+live',
                '-hls_list_size',
                '4',
                '-hls_flags',
                'delete_segments+append_list+omit_endlist',
                '-f',
                'hls',
                '-hls_time',
                '4',
                // '-hls_flags',
                // 'single_file',
                '-hls_playlist_type',
                'event',
                // '-flvflags',
                // 'no_duration_filesize',
                '-s',
                `${WIDTH}x${HEIGHT}`,
                '-framerate',
                FRAMERATE,
                '-b:v',
                VIDEO_BITRATE,
                '-b:a',
                AUDIO_BITRATE,
            ])
            .on('codecData', async (commandLine) => {
            })
            .on('start', (commandLine) => {
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('error', (err) => {
                console.error('Error:', err.message);
                console.error(err);
            })
            .on('progress', async (progress) => {
                if (!resolved) {
                    resolved = true;
                    r(command);
                }
                onProgress?.(progress.timemark);
            })
            .on('end', () => {
                onEnd?.();
                console.log("end!");
            });

        command.run();
    });

    await cmd;

    while (true) {
        await new Promise(r => setTimeout(r, 1000));
        const files = await $`ls ./${OUT_TMP_FOLDER}`;
        if (files.toString().includes(OUT_TMP_FILE_STREAM)) {
            break;
        }
    }

    return await cmd;
}

async function clearTmpJob() {
    while (true) {
        try {
            await new Promise(r => setTimeout(r, 10000));
            const text = (await $`cat ${OUT_TMP_STREAM} || echo ''`).toString();
            const files = (await $`ls ./${OUT_TMP_FOLDER}`).toString().split('\n').filter(f => OUT_TS_REGEXP.test(f));

            for (const file of files) {
                if (!text.includes(file)) {
                    await $`rm -rf ./${OUT_TMP_FOLDER}/${file}`
                }
            }
        } catch (error) {
            //
        }
    }
}

async function clearTmp() {
    await $`killall chrome`;
    await $`rm -rf ./${OUT_TMP_FOLDER}`;
    clearTmpJob();
}

async function createStream(onEnd?: Function) {
    const webStream = await createWebStream("http://localhost:3000/stream");
    const command = ffmpeg()
        .input(webStream)
        .inputOption(['-re'])
        .input(OUT_TMP_STREAM)
        .inputOption(['-re'])
        .output("rtmp://vsuc.okcdn.ru/input/910019655595_910019655595_71_c5apktm7hy")
        // .flvmeta()
        .format('flv')
        .complexFilter([
            {
                filter: `scale=${WIDTH}:${HEIGHT}`,
                inputs: "[0:v]",
                outputs: "[ckoutsize]",
            },
            {
                filter: `scale=${WIDTH}:${HEIGHT}`,
                inputs: "[1:v]",
                outputs: "[outsize]",
            },
            {
                filter: "colorkey=0x00FF00:0.45:0.1:",
                inputs: "[ckoutsize]",
                outputs: "[ckout]",
            },
            {
                filter: "overlay",
                inputs: "[outsize][ckout]",
                outputs: "[out]",
            },
        ])
        .addOutputOptions([
            '-c:v',
            'libx264',
            '-preset',
            'ultrafast',
            // '-filter_complex',
            // "'[1:v]colorkey=0x00FF00:0.3:0.2:[ckout];[0:v][ckout]overlay[out]'",
            '-map',
            '[out]',
            '-map',
            '1:a?',
            '-tune',
            'zerolatency',
            '-movflags',
            'isml+frag_keyframe+empty_moov+live',
            '-flvflags',
            'no_duration_filesize',
            '-s',
            `${WIDTH}x${HEIGHT}`,
            '-framerate',
            FRAMERATE,
            '-b:v',
            VIDEO_BITRATE,
            '-b:a',
            AUDIO_BITRATE,
        ])
        .on('start', (commandLine) => {
            console.log('Spawned Ffmpeg with command: ' + commandLine);
        })
        .on('error', (err) => {
            onEnd?.();
            console.error('Error:', err.message);
            console.error(err);
            // webStream?.destroy();
            // process.exit(1);
        })
        .on('progress', async (progress) => {
            console.log("command", progress.timemark);
        })
        .on('end', () => {
            onEnd?.();
            console.log("end!");
            process.exit(1);
        });

    return command;
}

async function applyEvents(state: State) {
    let changed = false;
    let event = state.events?.shift();

    if (event != null) {
        //   await apply({
        //     events: state.events,
        //   });
        changed = true;
    }

    while (event != null) {
        const [type, ...args] = event;
        switch (type) {
            case 'reload':
                //   window.location.href = window.location.href;
                break;
            case 'update':
                //   setState(args[0]);
                //   setCounter(counter + 1);
                break;
            case 'refresh':
                //   setCounter(counter + 1);
                break;
            default:
                console.error('Not event implemented', ...event);
        }

        event = state.events?.shift();
        if (event != null) {
            // await apply({
            //   events: [],
            // });
            changed = true;
        }
    }

    return {
        state,
        changed,
    };
}

async function getState(finish = false) {
    let state = await readJSON<State>(STATE_PATH, {
        events: [],
        played: [],
    }, S3_BUCKET);

    state = await nextVideo(state, S3_BUCKET!, {
        finish,
    });

    return {
        state,
        force: false,
    };
}

async function run() {
    clearTmp();

    const webEmptyStream = await createWebStream("http://localhost:3000/empty");
    const webEmptyStreamPass = new PassThrough();
    webEmptyStream.pipe(webEmptyStreamPass);

    let subCommand = await createSimpleStream(webEmptyStreamPass);

    let fileStream: Readable | null;
    let currentVideo: Video | null | undefined = null;

    async function update(finish = false) {
        const { state, force } = await getState(finish);

        if (currentVideo?.id !== state?.video?.id || force) {
            currentVideo = state?.video;

            if (currentVideo?.key) {
                const s3 = await getS3();
                const cmd = await s3.getObject({
                    Bucket: S3_BUCKET,
                    Key: currentVideo?.key,
                });

                fileStream?.destroy();
                fileStream = null;
                fileStream = Readable.fromWeb(cmd.Body?.transformToWebStream() as any);
            } else {
                fileStream?.destroy();
                fileStream = null;
            }

            try {
                (subCommand as any)?.ffmpegProc.stdin.write('q');
            } catch (error) {
                //
            }

            if (fileStream) {
                subCommand = await createSimpleStream(fileStream, () => {
                    setTimeout(() => update(true), 0);
                });
            } else {
                subCommand = await createSimpleStream(webEmptyStreamPass);
            }
        }
    }

    await update();

    setInterval(() => {
        update();
    }, 4000);

    await runCommand();
}

async function runCommand() {
    let command: ffmpeg.FfmpegCommand;

    command = await createStream(() => {
        runCommand();
    });

    command.run();
}

run();