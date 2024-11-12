"use client"

import React, { useMemo } from "react";
import {FirstDisplayedItemsCount, LastDisplayedItemsCount} from '@gravity-ui/uikit';
import {Breadcrumbs} from '@gravity-ui/uikit';
import {useBreadcrumbs} from "../../hooks/breadcrumbs";

export default function MdFile() {
  const { searchParams, breadcrumbs } = useBreadcrumbs();
  const url = useMemo(() => `/api/video?${searchParams.toString()}`, [...searchParams.values()]);

  return (
    <div className="relative container mx-auto px-2 py-2">
      <div className="flex flex-col gap-2 items-center">
        <div className="w-full px-3">
          <Breadcrumbs
            items={breadcrumbs}
            firstDisplayedItemsCount={FirstDisplayedItemsCount.One}
            lastDisplayedItemsCount={LastDisplayedItemsCount.Two}
          />
        </div>
        <div className="w-full">
          <video autoPlay muted={false} controls={true} src={url} width="100%" height="100%" />
        </div>
      </div>
    </div>
  );
}
