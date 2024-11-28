"use client"

import React, { ForwardedRef, useCallback, useEffect, useState } from "react";
import { useToaster, Button, Modal, TextInput } from '@gravity-ui/uikit';
import { useBreadcrumbs } from "../hooks/breadcrumbs";
import { useRouter } from "next/navigation";

export interface ModalTorrentRef {
  open: () => void;
}

export const ModalTorrent = React.forwardRef(({
  update,
}: {
  update: (req: Response) => void;
}, ref: ForwardedRef<ModalTorrentRef>) => {
  const { add } = useToaster();

  const [isOpen, setIsOpen] = React.useState(false);
  const [creating, setTorrenting] = useState(false);
  const [magnet, setMagnet] = useState('');
  const [wildcard, setWildcard] = useState('');
  const [path, setPath] = useState('videos');

  const onTorrent = useCallback(async () => {
    setTorrenting(true);

    try {
      const response = await fetch(`/api/torrent/load`, {
        method: 'POST',
        headers: {
          "Content-Type": "text/event-stream",
        },
        body: JSON.stringify({
          path,
          magnet,
          wildcards: wildcard.split(',').filter(Boolean),
        }),
      });

      update(response);

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
  }, [path, wildcard, magnet]);

  useEffect(() => {
    if (ref != null) {
      (ref as any).current = {
        open: () => {
          setMagnet('');
          setWildcard('');
          setIsOpen(true);
        }
      };
    }
  }, [ref, setPath, setMagnet, setWildcard, setIsOpen])

  return (
    <Modal open={isOpen} onClose={() => setIsOpen(false)}>
      <div className="flex flex-col gap-2 items-center p-4">
        <div className="w-full">
          Магнет ссылка:
        </div>
        <div className="flex flex-col gap-2 w-full">
          <TextInput size="l" value={magnet} onChange={e => setMagnet(e.currentTarget.value)} placeholder="magnet:" />
          <TextInput size="l" value={path} onChange={e => setPath(e.currentTarget.value)} placeholder="Путь" />
          <TextInput size="l" value={wildcard} onChange={e => setWildcard(e.currentTarget.value)} placeholder="*/video/*" />
        </div>
        <div className="w-full flex justify-between gap-2">
          <Button size="l" onClick={() => setIsOpen(false)}>Отмена</Button>
          <Button view="action" size="l" onClick={onTorrent} loading={creating}>Загрузить</Button>
        </div>
      </div>
    </Modal>
  );
});
