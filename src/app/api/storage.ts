import * as AWS from "@aws-sdk/client-s3";
import { Upload, Progress } from "@aws-sdk/lib-storage";

export async function getS3() {
    return new AWS.S3({
        endpoint: process.env.STORAGE_ENDPOINT,
        region: process.env.STORAGE_REGION ?? 'eu-central-1',
        credentials: {
            accessKeyId: process.env.STORAGE_KEY_ID!,
            secretAccessKey: process.env.STORAGE_KEY!,
        },
    });
}

export async function uploadS3(params: AWS.PutObjectCommandInput, onProgress: (progress: Progress) => void) {
    const client = await getS3();
    const parallelUploads3 = new Upload({
        client: client,
        // queueSize: 4, // optional concurrency configuration
        // partSize: 5MB, // optional size of each part
        leavePartsOnError: false, // optional manually handle dropped parts
        params: params,
    });

    parallelUploads3.on("httpUploadProgress", onProgress);

    await parallelUploads3.done();
}