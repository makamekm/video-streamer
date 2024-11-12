import * as AWS from "@aws-sdk/client-s3";

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