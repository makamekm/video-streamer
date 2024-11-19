import { type NextRequest } from 'next/server';
import { getStorage } from '@/app/api/storage';
import { getExt, normalizeName, normalizePath } from '@/app/api/path-utils';

const isFile = /.+\..+^/i;

export async function GET(req: NextRequest) {
  const path = normalizePath(req.nextUrl.searchParams.get('path') ?? '');

  const storage = await getStorage();

  const files = await storage.list(path || '');

  return Response.json([
    ...(
      files.filter(file => !isFile.test(file)).map(file => ({
        key: normalizePath(file),
        name: normalizeName(file),
        type: 'folder',
      })) ?? []
    ),
    ...(
      files.filter(file => isFile.test(file)).map(file => ({
        key: normalizePath(file),
        name: normalizeName(file),
        // date: file.LastModified,
        // size: file.Size,
        type: 'file',
        ext: getExt(file),
      })) ?? []
    ),
  ]);
}