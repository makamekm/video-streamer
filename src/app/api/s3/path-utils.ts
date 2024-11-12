export function normalizePath(path?: string) {
    return path?.replace(/^\/|\/$/g, '');
};

export function normalizeName(path?: string) {
    const paths = normalizePath(path)?.split('/') ?? [];
    return paths[paths.length - 1];
};

export function getExt(path?: string) {
    const paths = normalizePath(path)?.split('.') ?? [];
    const ext = paths[paths.length - 1];
    return ext === path ? '' : ext;
};
