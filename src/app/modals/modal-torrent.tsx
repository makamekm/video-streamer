"use client"

import React, { ForwardedRef, useCallback, useEffect, useState } from "react";
import {useToaster, Button, Modal, TextInput} from '@gravity-ui/uikit';
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
          setMagnet('magnet:?xt=urn:btih:E1894EBB466DF3400EFB3E7DEC508D78BE973C14&tr=http%3A%2F%2Fbt2.t-ru.org%2Fann%3Fmagnet&dn=%D0%93%D0%BE%D0%BB%D1%8B%D0%B9%20%D0%9F%D0%B8%D1%81%D1%82%D0%BE%D0%BB%D0%B5%D1%82%3A%20%D0%98%D0%B7%20%D0%90%D1%80%D1%85%D0%B8%D0%B2%D0%BE%D0%B2%20%D0%9F%D0%BE%D0%BB%D0%B8%D1%86%D0%B8%D0%B8!%20%2F%20The%20Naked%20Gun%3A%20From%20the%20Files%20of%20Police%20Squad!%20(%D0%94%D1%8D%D0%B2%D0%B8%D0%B4%20%D0%A6%D1%83%D0%BA%D0%B5%D1%80%20%2F%20David%20Zucker)%20%5B1988%2C%20%D0%A1%D0%A8%D0%90%2C%20%D0%BA%D0%BE%D0%BC%D0%B5%D0%B4%D0%B8%D1%8F%2C%20HDRip-AVC%5D%20VO%20(');
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
