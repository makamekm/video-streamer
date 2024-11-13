import { getS3 } from './storage';

export async function readJSON<T>(path: string, value: T, bucket?: string) {
  bucket = bucket ?? process.env.STORAGE_BUCKET;

  const s3 = await getS3();

  let json: any = value;

  try {
    const value = await s3.getObject({
      Bucket: bucket!,
      Key: path,
    });
    const text = await value.Body?.transformToString();
    json = JSON.parse(text ?? "{}");
    
  } catch (error) {
    console.log(error);
  }

  return json;
}