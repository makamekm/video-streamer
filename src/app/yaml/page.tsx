"use client"

import Guifier from 'guifier'
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {Button, FirstDisplayedItemsCount, LastDisplayedItemsCount, Loader, Overlay, useToaster} from '@gravity-ui/uikit';
import {Breadcrumbs} from '@gravity-ui/uikit';
import {useBreadcrumbs} from "../hooks/breadcrumbs";
import { useDebouncedEffect } from '../hooks/debounce';

export default function MdFile() {
  const { add } = useToaster();
  const el = useRef<HTMLDivElement>(null);
  const { searchParams, breadcrumbs } = useBreadcrumbs();
  const id = useMemo(() => 'gf', []);

  const [guifier, setGuifier] = useState<Guifier>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<string>('');
 
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const result = await fetch(`/api/s3/get?${searchParams.toString()}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      }).then(response => response.text());

      setData(result);
    } catch (error) {
      add({
        name: '',
        title: 'Ошибка',
        content: error?.toString() ?? 'Ошибка',
        theme: 'danger',
      });
    }

    setLoading(false);
  }, [searchParams]);

  useDebouncedEffect(() => {
    fetchData();
  }, [fetchData], 1000);

  const [submiting, setSubmiting] = useState(false);
  const onSubmit = async () => {
    setSubmiting(true);

    try {
      await fetch(`/api/s3/post?${searchParams.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
        },
        signal: AbortSignal.timeout(5000),
        body: guifier?.getData('yaml'),
      }).then(response => response.status);
    } catch (error) {
      add({
        name: '',
        title: 'Ошибка',
        content: error?.toString() ?? 'Ошибка',
        theme: 'danger',
      });
    }

    setSubmiting(false);
  };

  useEffect(() => {
    if (el.current) {
      el.current.innerHTML = '';
    }

    if (data) {
      if (guifier == null) {
        setGuifier(new Guifier({
          elementSelector: '#' + id,
          data: data,
          dataType: 'yaml'
        }));
      } else {
        guifier?.setData(data, 'yaml');
      }
    }
  }, [guifier, data]);

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
        <div className="w-full flex justify-end gap-2">
          <Button view="action" size="l" onClick={onSubmit} loading={loading || submiting}>Сохранить</Button>
        </div>
        <div ref={el} id={id} className="w-full">
        </div>
      </div>
      <Overlay visible={loading}>
        <Loader />
      </Overlay>
    </div>
  );
}
