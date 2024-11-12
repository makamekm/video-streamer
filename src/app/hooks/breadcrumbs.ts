import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export const useBreadcrumbs = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const getParams = useCallback((bucket?: string | null, path?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (bucket) {
      params.set('bucket', bucket);
    } else {
      params.delete('bucket');
    }

    if (path) {
      params.set('path', path);
    } else {
      params.delete('path');
    }
    
    return params.toString();
  }, [searchParams]);
  
  const updateParams = useCallback((bucket?: string | null, path?: string | null) => {
    router.push(`/s3?${getParams(bucket, path)}`);
  }, [getParams, searchParams]);

  const breadcrumbs = useMemo(() => {
    const bucket = searchParams.get('bucket');
    const path = searchParams.get('path');

    const arr: {
      text: string;
      action: () => void;
    }[] = [
      {
        text: `Корзины`,
        action: () => updateParams(),
      }
    ];

    if (bucket) {
      arr.push({
        text: bucket,
        action: () => updateParams(bucket),
      });
    }

    const paths = path?.split('/') || [];
    const bread: string[] = [];

    for (const name of paths) {
      bread.push(name);
      const key = bread.join('/');

      arr.push({
        text: name,
        action: () => updateParams(bucket, key),
      });
    }

    return arr;
  }, [searchParams, updateParams]);

  return {
    searchParams,
    breadcrumbs,
    updateParams,
    bucket: searchParams.get('bucket'),
    path: searchParams.get('path'),
    getParams,
  }
};