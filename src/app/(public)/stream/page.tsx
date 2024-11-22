"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVideoState } from "@/app/hooks/state";
import { Spin } from "@gravity-ui/uikit";

import './green.scss';

export default function MdFile() {
  const player = useRef<HTMLVideoElement>(null);
  const [inited, setInited] = useState(false);
  const [counter, setCounter] = useState(0);

  const { state, setState, apply } = useVideoState();

  const url = useMemo(
    () => {
      const time = inited ? (state.seek ?? 0) : (state.currentTime ?? 0);
      return {
        src: state.video?.key
          ? `/api/video?id=${state.video.id}&path=${state.video.key}&seek=${time}&counter=${counter}`
          : '',
        time: time,
      };
    },
    [state.video?.id, state.video?.key, state.seek, counter],
  );

  useEffect(() => {
    if (!inited && (state.currentTime != null || state.seek != null)) {
      setInited(true);
    }
  }, [state.video?.key, state.currentTime]);

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

  const updatePlayPause = () => {
    if (state.isPlaying && player.current?.paused == true) {
      player.current?.play().catch(() => { });
    } else if (!state.isPlaying && player.current?.paused == false) {
      player.current?.pause();
    }
  }

  useEffect(() => {
    updatePlayPause();
    const interval = setInterval(updatePlayPause, 1000);
    return () => clearInterval(interval);
  }, [state.isPlaying, player.current?.paused]);

  const updateEvents = useCallback(async () => {
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
  }, [state, counter]);

  useEffect(() => {
    updateEvents();
  }, [updateEvents, state.events, counter]);

  useEffect(() => {
    const update = () => {
      apply({
        currentTime: (player.current?.currentTime ?? 0) + (url.time ?? 0),
      });
    };
    const interval = setInterval(update, 5000);
    return () => {
      clearInterval(interval);
    }
  }, [player.current, state.video?.id, state.video?.key, counter]);

  return (
    <div className="relative flex items-center justify-center h-[100vh] w-[100wh]">
      {/* <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 text-white">
        <div className="flex items-center gap-4">
          <div className="px-16 py-8 text-white bg-black text-3xl font-bold">КОЛХОЗ ******* ТВ</div>
        </div>
      </div> */}
      <div className="absolute left-4 top-4 text-white">
        <div className="flex items-center gap-4">
          <div className="px-16 py-8 text-white bg-black text-3xl font-bold">Мульт ТВ</div>
        </div>
      </div>
    </div>
  );
}
