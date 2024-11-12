"use client"

import React, { useCallback, useEffect, useState } from "react";
import {Button, FirstDisplayedItemsCount, LastDisplayedItemsCount, Loader, Overlay, useToaster} from '@gravity-ui/uikit';
import {useMarkdownEditor, MarkdownEditorView} from '@gravity-ui/markdown-editor';
import {toaster} from '@gravity-ui/uikit/toaster-singleton-react-18';
import {Breadcrumbs} from '@gravity-ui/uikit';
import {useBreadcrumbs} from "../../hooks/breadcrumbs";
import { useDebouncedEffect } from "../../hooks/debounce";

export default function MdFile() {
  const { add } = useToaster();
  const { searchParams, breadcrumbs } = useBreadcrumbs();

  const [loading, setLoading] = useState(true);
  const [, setData] = useState<string>('');

  const editor = useMarkdownEditor({allowHTML: false});
 
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const result = await fetch(`/api/s3/get?${searchParams.toString()}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      }).then(response => response.text());
      
      editor.clear();
      editor.append(result);

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
        body: editor.getValue(),
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
        <div className="w-full">
          <MarkdownEditorView className="rounded border-solid border border-gray-500/20 min-h-[200px]" stickyToolbar autofocus toaster={toaster} editor={editor} />
        </div>
      </div>
      <Overlay visible={loading}>
        <Loader />
      </Overlay>
    </div>
  );
}
