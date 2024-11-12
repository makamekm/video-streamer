"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {useBreadcrumbs} from "../../hooks/breadcrumbs";

const useVideoPublicController = (fn?: (data: string) => void | Promise<void>) => {
  const state = useMemo<{
    canListening: boolean;
    isListening: boolean;
    reader: ReadableStreamDefaultReader<string> | null
  }>(() => ({
    canListening: true,
    isListening: false,
    reader: null,
  }), []);

  const startListening = useCallback(async () => {
    state.isListening = true;

    try {
      const apiResponse = await fetch("/api/video/public", {
        method: "POST",
        headers: {
          "Content-Type": "text/event-stream",
        },
        body: JSON.stringify({}),
      });
   
      if (!apiResponse.body) return;
   
      const reader = apiResponse.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
      
        state.reader = reader;
   
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        if (value) {
          fn?.(value);
        }
      }
    } catch (error) {
      console.error(error);
    }

    state.reader = null;
    state.isListening = false;
  }, []);

  useEffect(() => {
    state.canListening = true;
    const interval = setInterval(async () => {
      if (!state.isListening && state.canListening && !state.reader) {
        await startListening();
      }
    }, 1000);
    return () => {
      clearInterval(interval);
      state.canListening = false;
      state.reader?.cancel();
      state.reader = null;
    };
  }, []);
}

export default function MdFile() {
  const { searchParams } = useBreadcrumbs();
  const url = useMemo(() => `/api/video?bucket=stream-video&path=BigBuckBunny.mp4`, [...searchParams.values()]);

  useVideoPublicController(console.log);

  return (
    <div className="flex items-center justify-center h-[100vh] w-[100wh]">
      <video className="w-full h-full" width="100%" height="100%" autoPlay muted={false} controls={true} src={url} />
    </div>
  );
}
