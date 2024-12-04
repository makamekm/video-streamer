"use client"

import React, { useEffect, useState } from "react";
import { TableDataItem, TableActionConfig } from '@gravity-ui/uikit';
import { useFSState } from "@/app/hooks/state";

export default function Home() {
  const [url, setUrl] = useState('localhost');
  const stream = useFSState();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(window.location.hostname);
    }
  }, []);

  return (
    <div className="flex-1 relative mx-auto flex flex-col">
      <div className="flex-1 flex flex-col items-center">
        {
          stream.port != null
            ? <iframe className="flex-1 w-full" src={`http://${url}:${stream.port}/`} />
            : null
        }
      </div>
    </div>
  );
}
