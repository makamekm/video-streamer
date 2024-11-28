import 'dotenv/config';

import { $ } from 'zx';
import ffmpeg from "fluent-ffmpeg";
const { StreamInput, StreamOutput } = require('fluent-ffmpeg-multistream');
import { PassThrough, Readable, Transform } from "node:stream";
import { launch, getStream } from "puppeteer-stream";
import { type Page } from "puppeteer-core";
import { executablePath } from "puppeteer";
import { resolve } from 'path';
import { getStorage } from "../../app/api/storage";
import { nextVideo } from '../../app/api/read';
import { State, Video } from '../../app/state';

// width: 1600,
// height: 900,
const OUT_TMP_FOLDER = 'tmp';
const OUT_TMP_FILE_STREAM = 'out.m3u8';
const OUT_TMP_STREAM = `${OUT_TMP_FOLDER}/${OUT_TMP_FILE_STREAM}`;
const OUT_TS_REGEXP = /^out\d+\.ts$/;
const STATE_PATH = 'state.json';

const WIDTH = 1920;
const HEIGHT = 1080;
const VIDEO_BITRATE = '2500k';
const AUDIO_BITRATE = '128k';
const FRAMERATE = '24';
const GBUFFER = '48';
const BUFF_SIZE = '9000k';
const QUALITY_MAIN_CF = '20';
const QUALITY_SUB_CF = '20';

const RESTART_TIMEOUT = 60000;

let page: Page;

async function createWebStream(url: string) {
    const browser = await launch({
        executablePath: executablePath(),
        headless: "new",
        userDataDir: resolve(`./${OUT_TMP_FOLDER}/chrome_${(Math.random() * 1_000_000).toFixed()}`),
        defaultViewport: {
            width: WIDTH,
            height: HEIGHT,
        },
        args: ['--enable-gpu', '--no-sandbox'],
        // args: ['--no-sandbox'],
    });

    page = await browser.newPage();
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
        const command = ffmpeg()
            .input(stream)
            .inputOptions([
                '-probesize',
                '10M',
                '-analyzeduration',
                '5000000',
                '-rw_timeout',
                '5000000',
                '-y',
                '-re',
            ])
            .format('hls')
            .output(OUT_TMP_STREAM)
            // .output("rtmp://localhost:1935/sdfsdf")
            .addOutputOptions([
                '-c:v',
                'libx264',
                '-c:a',
                'mp3',
                '-preset',
                'veryfast',
                // '-tune',
                // 'zerolatency',
                '-movflags',
                'isml+frag_keyframe+empty_moov+live',
                // '-f', 'dash', '-seg_duration', '2', '-window_size', '5', '-extra_window_size', '2', '-remove_at_exit', '1',
                '-f',
                'hls',
                '-hls_list_size',
                '10',
                '-hls_flags',
                'delete_segments+append_list+omit_endlist+program_date_time',
                // 'delete_segments+append_list+omit_endlist+discont_start',
                // 'delete_segments+append_list+omit_endlist+independent_segments',
                '-hls_time',
                '6',
                '-hls_delete_threshold',
                '1',
                '-hls_segment_type',
                'mpegts',
                // '-hls_flags',
                // 'single_file',
                // '-hls_playlist_type',
                // 'event',
                '-hls_fmp4_init_resend',
                '1',
                // '-flvflags',
                // 'no_duration_filesize',
                '-max_delay',
                '5000000',
                '-reorder_queue_size',
                '1024',
                '-s',
                `${WIDTH}x${HEIGHT}`,
                '-framerate',
                FRAMERATE,
                '-b:v',
                VIDEO_BITRATE,
                '-b:a',
                AUDIO_BITRATE,
                '-bufsize',
                BUFF_SIZE,
                '-maxrate',
                VIDEO_BITRATE,
                '-analyzeduration',
                '0',
                '-probesize',
                '32',
                '-fflags',
                '-nobuffer',
                '-g',
                GBUFFER,
                '-crf',
                QUALITY_SUB_CF,
                '-ar',
                '44100',
                '-ac',
                '2',
                '-drop_pkts_on_overflow',
                '1',
                '-attempt_recovery',
                '1',
                '-recover_any_error 1',
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
                console.log("subcommand", progress.timemark);
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
    await $`killall chrome || true`;
    await $`rm -rf ./${OUT_TMP_FOLDER} || true`;
    // clearTmpJob();
}

async function createStream(url: string, webStream: Transform, onEnd?: Function, onProgress?: Function) {
    const command = ffmpeg()
        .input(webStream)
        .inputOptions([
            '-y',
            // '-probesize',
            // '10M',
            // '-analyzeduration',
            // '5000000',
            '-rw_timeout',
            '5000000',
            '-re',
        ])
        // .input("http://localhost:8888/sdfsdf/index.m3u8")
        .input(OUT_TMP_STREAM)
        // .input(StreamInput(fileStream).url)
        .inputOptions([
            '-y',
            // '-probesize',
            // '10M',
            // '-analyzeduration',
            // '5000000',
            '-rw_timeout',
            '5000000',
            '-re',
        ])
        // .output("rtmp://vsuc.okcdn.ru/input/910019655595_910019655595_71_c5apktm7hy")
        .output(url)
        // .output("rtmp://localhost:1935/sdfsdf")
        // http://192.168.0.209:/sdfsdf/index.m3u8
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
            '-pix_fmt',
            'yuv420p',
            '-c:v',
            'libx264',
            '-c:a',
            'mp3',
            '-preset',
            'veryfast',
            // '-filter_complex',
            // "'[1:v]colorkey=0x00FF00:0.3:0.2:[ckout];[0:v][ckout]overlay[out]'",
            '-map',
            '[out]',
            '-map',
            '1:a?',
            // '-tune',
            // 'zerolatency',
            '-flags',
            '+global_header+low_delay',
            '-movflags',
            'isml+frag_keyframe+empty_moov+live',
            '-flvflags',
            'no_duration_filesize',
            '-max_delay',
            '5000000',
            '-reorder_queue_size',
            '1024',
            '-s',
            `${WIDTH}x${HEIGHT}`,
            '-framerate',
            FRAMERATE,
            '-b:v',
            VIDEO_BITRATE,
            '-b:a',
            AUDIO_BITRATE,
            '-bufsize',
            BUFF_SIZE,
            '-maxrate',
            VIDEO_BITRATE,
            '-analyzeduration',
            '0',
            '-probesize',
            '32',
            '-fflags',
            '-nobuffer',
            '-g',
            GBUFFER,
            '-crf',
            QUALITY_MAIN_CF,
            '-ar',
            '44100',
            '-ac',
            '2',
            '-reconnect', '1',
            '-reconnect_at_eof', '1',
            '-reconnect_streamed', '1',
            '-reconnect_delay_max', '2',
            '-drop_pkts_on_overflow',
            '1',
            '-attempt_recovery',
            '1',
            '-recover_any_error 1',
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
            onProgress?.(progress.timemark);
            console.log("command", progress.timemark);
        })
        .on('end', () => {
            onEnd?.();
            console.log("end!");
            // process.exit(1);
        });

    return command;
}

// async function applyEvents(state: State) {
//     let changed = false;
//     let event = state.events?.shift();

//     if (event != null) {
//         //   await apply({
//         //     events: state.events,
//         //   });
//         changed = true;
//     }

//     while (event != null) {
//         const [type, ...args] = event;
//         switch (type) {
//             case 'reload':
//                 //   window.location.href = window.location.href;
//                 break;
//             case 'update':
//                 //   setState(args[0]);
//                 //   setCounter(counter + 1);
//                 break;
//             case 'refresh':
//                 //   setCounter(counter + 1);
//                 break;
//             default:
//                 console.error('Not event implemented', ...event);
//         }

//         event = state.events?.shift();
//         if (event != null) {
//             // await apply({
//             //   events: [],
//             // });
//             changed = true;
//         }
//     }

//     return {
//         state,
//         changed,
//     };
// }

async function getState(finish = false) {
    const storage = await getStorage();

    let state = await storage.readJSON<State>(STATE_PATH, {
        // events: [],
        played: [],
    });

    state = await nextVideo(state, storage, {
        finish,
    });

    return {
        state,
        force: false,
    };
}

async function run() {
    clearTmp();

    const cmd = await getState();
    let state = cmd.state;

    // const webStream = await createWebStream("http://localhost:3000/stream");
    const webStream = await createWebStream(state.uiUrl || "https://www.figma.com/proto/A5pSlrVoxeEX7368ZA1dgp/%D0%A1%D1%82%D1%80%D0%B8%D0%BC---%D0%9F%D1%83%D1%82%D0%B5%D1%88%D0%B5%D1%81%D1%82%D0%B2%D0%B8%D1%8F?node-id=4-9&node-type=canvas&t=flYAcaWiMCFUB0O0-0&scaling=contain&content-scaling=responsive&page-id=0%3A1&hotspot-hints=0&disable-default-keyboard-nav=1&hide-ui=1");
    // const webEmptyStream = await createWebStream("http://localhost:3000/empty");
    // const webEmptyStreamPass = new PassThrough();
    // webEmptyStream.pipe(webEmptyStreamPass);

    let subCommand: ffmpeg.FfmpegCommand;

    // subCommand = await createSimpleStream(webEmptyStreamPass, () => {
    //     // setTimeout(() => update(true), 0);
    // });

    let fileStream: Readable | null;
    let currentVideo: Video | null | undefined = null;

    async function update(finish = false) {
        const cmd = await getState(finish);
        state = cmd.state;

        if (currentVideo?.id !== state?.video?.id || cmd.force) {
            currentVideo = state?.video;
            console.log(currentVideo);

            if (currentVideo?.key) {
                const storage = await getStorage();
                fileStream?.unpipe();
                fileStream?.destroy();
                fileStream = null;
                fileStream = await storage.read(currentVideo?.key);
            } else {
                // webEmptyStream?.unpipe();
                fileStream?.unpipe();
                fileStream?.destroy();
                fileStream = null;
            }

            try {
                subCommand?.kill("SIGTERM");
            } catch (error) {
                //
            }
            // try {
            //     // (subCommand as any)?.ffmpegProc.stdin.write('q');
            // } catch (error) {
            //     console.log(error);
            //     //
            // }

            // await $`rm -rf ./${OUT_TMP_FOLDER}/*.ts || true`;
            // await $`rm -rf ./${OUT_TMP_STREAM} || true`;

            if (fileStream) {
                // fileStream.pipe(webEmptyStreamPass);

                console.log(currentVideo?.key);

                subCommand = await createSimpleStream(fileStream, () => {
                    setTimeout(() => update(true), 0);
                });

                // subCommand.input(fileStream);
            } else {
                // webEmptyStream.pipe(webEmptyStreamPass);
                // fileStream.pipe(webEmptyStreamPass);
                // subCommand = await createSimpleStream(webEmptyStreamPass);
                // subCommand.input(webEmptyStreamPass);
            }

            // runCommand(fileStream);
        }
    }

    await update();

    async function updateUI(selector: string) {
        try {
            const elements = await page?.$$(selector);
            for (const element of elements) {
                // const elementText = await page.evaluate(element => element?.outerHTML, element);
                // console.log(elementText);
                await element.click();
            }
        } catch (error) {
            //
        }
    }

    setInterval(() => {
        update();
    }, 4000);

    setInterval(() => {
        updateUI('button[data-testid="close-button"]');
        updateUI('button[data-testid="visual-bell-dismiss-button"]');
    }, 2000);

    let started = false;
    let time = +new Date();

    setInterval(() => {
        if (started && ((time + RESTART_TIMEOUT) < +new Date())) {
            started = false;
            time = +new Date();
            runCommand(state.url || "rtmp://vsuc.okcdn.ru/input/910019655595_910019655595_71_c5apktm7hy", webStream, () => {
                started = true;
                time = +new Date();
            });
        }
    }, 5000);

    await runCommand(state.url || "rtmp://vsuc.okcdn.ru/input/910019655595_910019655595_71_c5apktm7hy", webStream, () => {
        started = true;
        time = +new Date();
    });
}

let command: ffmpeg.FfmpegCommand;

async function runCommand(url: string, webStream: Transform, onProgress?: Function) {
    try {
        command?.kill("SIGTERM");
    } catch (error) {
        //
    }

    command = await createStream(url, webStream, () => {
        runCommand(url, webStream, onProgress);
    });
    // command = await createStream(fileStream, onEnd);

    command.run();
}

run();