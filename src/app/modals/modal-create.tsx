"use client"

import React, { ForwardedRef, useCallback, useEffect, useState } from "react";
import {useToaster, Button, Modal, TextInput} from '@gravity-ui/uikit';
import { useBreadcrumbs } from "../hooks/breadcrumbs";
import { useRouter } from "next/navigation";

export interface ModalCreateRef {
  open: () => void;
}

export const ModalCreate = React.forwardRef(({
  update,
}: {
  update: () => void;
}, ref: ForwardedRef<ModalCreateRef>) => {
  const { add } = useToaster();
  const router = useRouter();
  const { path, getParams } = useBreadcrumbs();

  const [openCreating, setOpenCreating] = React.useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingName, setCreatingName] = useState('');

  const onCreate = useCallback(async () => {
    setCreating(true);

    try {
      const key = [path, creatingName].join('/');

      await fetch(`/api/s3/post?${getParams(key)}`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000),
        body: '',
      }).then(response => response.status);

      const parts = key.split('.');
      const ext = parts[parts.length - 1];

      update();
      
      setOpenCreating(false);
    } catch (error) {
      add({
        name: '',
        title: 'Ошибка',
        content: error?.toString() ?? 'Ошибка',
        theme: 'danger',
      });
    }

    setCreating(false);
  }, [path, creatingName]);

  useEffect(() => {
    if (ref != null) {
      (ref as any).current = {
        open: () => {
          setCreatingName('');
          setOpenCreating(true);
        }
      };
    }
  }, [ref, setCreatingName, setOpenCreating])

  return (
    <Modal open={openCreating} onClose={() => setOpenCreating(false)}>
      <div className="flex flex-col gap-2 items-center p-4">
        <div className="w-full">
          Имя файла:
        </div>
        <div className="w-full">
          <TextInput size="l" value={creatingName} onChange={e => setCreatingName(e.currentTarget.value)} placeholder="readme.md" />
        </div>
        <div className="w-full flex justify-between gap-2">
          <Button size="l" onClick={() => setOpenCreating(false)}>Отмена</Button>
          <Button view="action" size="l" onClick={onCreate} loading={creating}>Сохранить</Button>
        </div>
      </div>
    </Modal>
  );
});
