"use client";

import { useEffect, useState } from "react";

export default function Loading({ theme }: { theme: 'dark' | 'light' }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);
  
  return (
    <div className={`absolute z-[100] left-0 right-0 bottom-0 top-0 ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} flex flex-col gap-2 items-center justify-center pointer-events-none duration-200 transition-opacity`} style={{
      'opacity': loading ? 1 : 0,
    }}>
      Загрузочка :)
    </div>
  );
}
