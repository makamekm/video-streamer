"use client"

import React, { useMemo } from "react";
import {useBreadcrumbs} from "../../hooks/breadcrumbs";

export default function MdFile() {
  const { searchParams, breadcrumbs } = useBreadcrumbs();
  const url = useMemo(() => `/api/video?bucket=stream-video&path=BigBuckBunny.mp4`, [...searchParams.values()]);

  return (
    <div className="flex items-center justify-center h-[100vh] w-[100wh]">
      <video className="w-full h-full" width="100%" height="100%" autoPlay muted={false} controls={true} src={url} />
    </div>
  );
}
