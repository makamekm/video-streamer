import { type NextRequest } from 'next/server';
import { getS3 } from './storage';
import { getExt, normalizeName, normalizePath } from './path-utils';

export async function GET(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get('bucket') ?? process.env.STORAGE_BUCKET;
  const path = normalizePath(req.nextUrl.searchParams.get('path') ?? '');
  const sub = !!req.nextUrl.searchParams.get('sub');

  const s3 = await getS3();
  
  if (!bucket) {
    const cmd = await s3.listBuckets();
 
    return Response.json(cmd.Buckets?.map(obj => ({
      key: obj.Name,
      name: obj.Name,
      date: obj.CreationDate,
      type: 'bucket',
    })) ?? []);
  }

  const cmd = await s3.listObjectsV2({
    Bucket: bucket!,
    Prefix: (path ? (path + '/') : ''),
    Delimiter: sub ? undefined : '/',
  });
 
  return Response.json([
    ...(
      cmd.CommonPrefixes?.map(obj => ({
        key: normalizePath(obj.Prefix),
        name: normalizeName(obj.Prefix),
        type: 'folder',
      })) ?? []
    ),
    ...(
      cmd.Contents?.map(obj => ({
        key: normalizePath(obj.Key),
        name: normalizeName(obj.Key),
        date: obj.LastModified,
        size: obj.Size,
        type: 'file',
        ext: getExt(obj.Key),
      })) ?? []
    ),
  ]);
}