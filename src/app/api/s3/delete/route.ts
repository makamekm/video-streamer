import { type NextRequest } from 'next/server';
import { getS3 } from '../storage';
import { normalizePath } from '../path-utils';

export async function POST(req: NextRequest) {
  const bucket = req.nextUrl.searchParams.get('bucket') ?? process.env.STORAGE_BUCKET;
  const path = normalizePath(req.nextUrl.searchParams.get('path') ?? '');
  const type = normalizePath(req.nextUrl.searchParams.get('type') ?? 'file');
  
  if (!bucket) {
    return Response.json(
      { success: false, message: 'no bucket' },
      { status: 404 },
    );
  }
  
  if (!path) {
    return Response.json(
      { success: false, message: 'no path' },
      { status: 404 },
    );
  }
  
  if (!type) {
    return Response.json(
      { success: false, message: 'no type' },
      { status: 404 },
    );
  }

  const s3 = await getS3();

  try {
    if (type === 'file') {
      await s3.deleteObject({
        Bucket: bucket!,
        Key: path,
      });

      return Response.json(
        { success: true, affectedFiles: 1 },
        {
          status: 200,
          statusText: "OK",
        },
      );
    } else if (type === 'folder') {
      const cmd = await s3.listObjectsV2({
        Bucket: bucket!,
        Prefix: (path ? (path + '/') : ''),
      });

      const objectsToDelete = cmd.Contents?.map(obj => ({
        Key: obj.Key,
      })) ?? [];
      
      if (objectsToDelete.length > 0) {
        await s3.deleteObjects({
          Bucket: bucket!,
          Delete: {
            Objects: objectsToDelete,
          },
        });
      }

      return Response.json(
        { success: true, affectedFiles: objectsToDelete.length },
        {
          status: 200,
          statusText: "OK",
        },
      );
    }

    return Response.json(
      { success: false, message: `not inplemented type: "${type}"` },
      {
        status: 500,
      },
    );
  } catch (error) {
    return Response.json(
      { success: false, message: error?.toString() },
      { status: 404 },
    );
  }
}