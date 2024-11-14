"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVideoState } from "@/app/hooks/state";

export default function MdFile() {
  const player = useRef<HTMLVideoElement>(null);
  const [counter, setCounter] = useState(0);

  const {state, setState, apply} = useVideoState();

  const url = useMemo(
    () => state.video?.key
      ? `/api/video?path=${state.video?.key}&seek=${state.currentTime ?? 0}`
      : '',
    [state.video?.key, counter],
  );

  useEffect(() => {
    const onFinish = async () => {
      const response = await fetch("/api/video/state/finish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(state),
      });
      setState(await response.json());
    };

    player.current?.addEventListener('ended', onFinish, false);
  }, [player.current]);

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
          break;
        case 'update':
          setState(args[0]);
          setCounter(counter + 1);
          break;
        case 'refresh':
          setCounter(counter + 1);
          break;
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

  useEffect(() => {
    const update = () => {
      apply({
        currentTime: player.current?.currentTime ?? 0,
      });
    };
    const interval = setInterval(update, 4000);
    return () => {
      clearInterval(interval);
    }
  }, [player.current]);

  return (
    <div className="flex items-center justify-center h-[100vh] w-[100wh]">
      {!url
        ? null
        : <video
          key={url}
          ref={player}
          className="w-full h-full pointer-events-none"
          width="100%"
          height="100%"
          autoPlay={state.isPlaying}
          muted={false}
          controls={false}
          src={url}
        />}
    </div>
  );
}
