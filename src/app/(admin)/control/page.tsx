"use client"

import React from "react";
import {Button, Loader, Overlay, Switch} from '@gravity-ui/uikit';
import {useBreadcrumbs} from "@/app/hooks/breadcrumbs";
import { useVideoState } from "@/app/hooks/state";

export default function MdFile() {
  const { searchParams } = useBreadcrumbs();
  const {state, apply, loading} = useVideoState(searchParams);

  return (
    <div className="flex-1 flex flex-col relative container mx-auto px-2 py-2 min-h-[100%]">
      <div className="flex-1 flex flex-col items-center gap-2">
        <div className="flex-1 flex items-center justify-center w-full gap-2">
          <Switch size="l" checked={state.isPlaying ?? false} onUpdate={(value) => {
            apply({
              ...state,
              isPlaying: value,
            });
          }}>Play</Switch>
          <Button onClick={() => {
            apply({
              ...state,
              events: [...(state.events ?? []), ['reload']],
            });
          }}>Перезагрузить</Button>
        </div>
      </div>
      <Overlay visible={loading}>
        <Loader />
      </Overlay>
    </div>
  );
}
