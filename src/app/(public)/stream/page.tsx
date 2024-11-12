"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {useBreadcrumbs} from "@/app/hooks/breadcrumbs";
import { useVideoState } from "@/app/hooks/state";


export default function MdFile() {
  const player = useRef<HTMLVideoElement>(null);
  const { searchParams } = useBreadcrumbs();
  const url = useMemo(() => `/api/video?bucket=stream-video&path=BigBuckBunny.mp4`, [...searchParams.values()]);

  const {state, apply} = useVideoState();

  useEffect(() => {
    if (state.isPlaying && player.current?.paused == true) {
      player.current?.play();
    } else if (!state.isPlaying && player.current?.paused == false) {
      player.current?.pause();
    }
  }, [state.isPlaying, player.current?.paused]);

  const updateEvents = async () => {
    let event = state.events?.shift();

    if (event != null) {
      await apply({
        events: state.events,
      });
    }

    while (event != null) {
      const [type, ...args] = event;
      switch (type) {
        case 'reload':
          window.location.href = window.location.href;
        default:
          console.error('Not event implemented', ...event);
      }

      event = state.events?.shift();
      if (event != null) {
        await apply({
          events: state.events,
        });
      }
    }
  }

  useEffect(() => {
    updateEvents();
  }, [state.events]);

  return (
    <div className="flex items-center justify-center h-[100vh] w-[100wh]">
      <video ref={player} className="w-full h-full" width="100%" height="100%" autoPlay={state.isPlaying} muted={false} controls={true} src={url} />
    </div>
  );
}
