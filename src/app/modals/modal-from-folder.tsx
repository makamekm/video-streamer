"use client"

import React, { ForwardedRef, useCallback, useEffect, useState } from "react";
import { useToaster, Button, Modal, TextInput } from '@gravity-ui/uikit';

export interface ModalFromFolderRef {
  open: () => void;
}

export const ModalFromFolder = React.forwardRef(({
  update,
}: {
  update: (result: any) => void;
}, ref: ForwardedRef<ModalFromFolderRef>) => {
  const { add } = useToaster();

  const [isOpen, setIsOpen] = React.useState(false);
  const [creating, setTorrenting] = useState(false);
  const [path, setPath] = useState('');
  const [name, setName] = useState('');

  const onTorrent = useCallback(async () => {
    setTorrenting(true);

    try {
      const response = await fetch(`/api/playlist/folder`, {
        method: 'POST',
        headers: {
          // "Content-Type": "text/event-stream",
        },
        body: JSON.stringify({
          name,
          path,
        }),
      });

      update(await response.json());

      setIsOpen(false);
    } catch (error) {
      add({
        name: '',
        title: 'Ошибка',
        content: error?.toString() ?? 'Ошибка',
        theme: 'danger',
      });
    }

    setTorrenting(false);
  }, [name, path]);

  useEffect(() => {
    if (ref != null) {
      (ref as any).current = {
        open: () => {
          setName('');
          setPath('videos/*');
          setIsOpen(true);
        }
      };
    }
  }, [ref, setName, setPath, setIsOpen])

  return (
    <Modal open={isOpen} onClose={() => setIsOpen(false)}>
      <div className="flex flex-col gap-2 items-center p-4">
        <div className="w-full">
          Плейлист из папки:
        </div>
        <div className="flex flex-col gap-2 w-full">
          <TextInput size="l" value={name} onChange={e => setName(e.currentTarget.value)} placeholder="Название" />
          <TextInput size="l" value={path} onChange={e => setPath(e.currentTarget.value)} placeholder="video/*" />
        </div>
        <div className="w-full flex justify-between gap-2">
          <Button size="l" onClick={() => setIsOpen(false)}>Отмена</Button>
          <Button view="action" size="l" onClick={onTorrent} loading={creating} disabled={!name || !path}>Создать</Button>
        </div>
      </div>
    </Modal>
  );
});
