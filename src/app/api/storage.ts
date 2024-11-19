import * as AWS from "@aws-sdk/client-s3";
import { Upload, Progress } from "@aws-sdk/lib-storage";
import { $ } from 'zx';
import { createReadStream, createWriteStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";

const LOCAL_PATH = resolve('./files');
let storage: IStorage;

export async function getStorage() {
    storage = storage ?? new LocalStorage()
    return storage;
}

// return new AWS.S3({
//     endpoint: process.env.STORAGE_ENDPOINT,
//     region: process.env.STORAGE_REGION ?? 'eu-central-1',
//     credentials: {
//         accessKeyId: process.env.STORAGE_KEY_ID!,
//         secretAccessKey: process.env.STORAGE_KEY!,
//     },
// });

// export async function uploadS3(params: AWS.PutObjectCommandInput, onProgress: (progress: Progress) => void) {
//     const client = await getS3();
//     const parallelUploads3 = new Upload({
//         client: client,
//         // queueSize: 4, // optional concurrency configuration
//         // partSize: 5MB, // optional size of each part
//         leavePartsOnError: false, // optional manually handle dropped parts
//         params: params,
//     });

//     parallelUploads3.on("httpUploadProgress", onProgress);

//     await parallelUploads3.done();
// }

export interface IStorage {
    read(key: string): Promise<Readable>;
    readJSON<T = any>(key: string, defaultValue: T): Promise<T>;
    write(key: string, stream: Readable): Promise<boolean>;
    writeJSON<T = any>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
    list(key: string): Promise<string[]>;
}

export class LocalStorage implements IStorage {
    async read(key: string): Promise<Readable> {
        return createReadStream(resolve(LOCAL_PATH, key));
    }

    async readJSON<T = any>(key: string, defaultValue: T): Promise<T> {
        let json: any = undefined;
        try {
            const text = await readFile(resolve(LOCAL_PATH, key), "utf-8");
            json = JSON.parse(text ?? "null");
        } catch (error) {
            console.log(error);
        }
        return json ?? defaultValue;
    }

    async write(key: string, stream: Readable): Promise<boolean> {
        return new Promise(async (r, e) => {
            await $`mkdir -p ${dirname(resolve(LOCAL_PATH, key))}`;
            const ws = createWriteStream(resolve(LOCAL_PATH, key));
            stream.pipe(ws);
            ws.on("finish", () => { r(true); });
            ws.on("error", e);
        });
    }

    async writeJSON<T = any>(key: string, value: T): Promise<void> {
        writeFile(resolve(LOCAL_PATH, key), JSON.stringify(value));
    }

    async remove(key: string): Promise<void> {
        await $`rm -rf ${resolve(LOCAL_PATH, key)} || true`;
    }

    async list(key: string): Promise<string[]> {
        const files = (await $`ls ${resolve(LOCAL_PATH, key)}`).toString().split('\n').filter(Boolean);
        return files.map(file => join(key, file.trim()));
    }
}