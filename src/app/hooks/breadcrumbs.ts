import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export const useBreadcrumbs = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const getParams = useCallback((path?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (path) {
      params.set('path', path);
    } else {
      params.delete('path');
    }
    
    return params.toString();
  }, [searchParams]);
  
  const updateParams = useCallback((path?: string | null) => {
    router.push(`/s3?${getParams(path)}`);
  }, [getParams, searchParams]);

  const breadcrumbs = useMemo(() => {
    const path = searchParams.get('path');

    const arr: {
      text: string;
      action: () => void;
    }[] = [
      {
        text: `Корзина`,
        action: () => updateParams(),
      }
    ];

    const paths = path?.split('/') || [];
    const bread: string[] = [];

    for (const name of paths) {
      bread.push(name);
      const key = bread.join('/');

      arr.push({
        text: name,
        action: () => updateParams(key),
      });
    }

    return arr;
  }, [searchParams, updateParams]);

  return {
    searchParams,
    breadcrumbs,
    updateParams,
    path: searchParams.get('path'),
    getParams,
  }
};