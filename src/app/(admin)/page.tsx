"use client"

import React from "react";
import {Overlay, Loader} from '@gravity-ui/uikit';

export default function Home() {
  return (
    <div className="relative container mx-auto px-2 py-2">
      <div className="flex flex-col gap-2 items-center">
        Админка
      </div>
      <Overlay visible={false}>
        <Loader />
      </Overlay>
    </div>
  );
}
