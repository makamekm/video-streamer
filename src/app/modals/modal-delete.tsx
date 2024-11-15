"use client"

import React, { ForwardedRef, useCallback, useEffect, useState } from "react";
import {useToaster, Button, Modal} from '@gravity-ui/uikit';
import { useBreadcrumbs } from "../hooks/breadcrumbs";

export interface ModalDeleteRef {
  open: (key: string, type: string) => void;
}

export const ModalDelete = React.forwardRef(({
  update,
}: {
  update?: () => void;
}, ref: ForwardedRef<ModalDeleteRef>) => {
  const { add } = useToaster();
  const { getParams } = useBreadcrumbs();

  const [openDeleting, setOpenDeleting] = React.useState(false);
  const [deleting, setDeleting] = useState(false);
  const [key, setKey] = useState('');
  const [type, setType] = useState('');

  const onDelete = useCallback(async () => {
    if (!key || !type) return;

    setDeleting(true);

    try {
      await fetch(`/api/s3/delete?${getParams(key)}&type=${type}`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000),
      }).then(response => response.status);

      update?.();
      setOpenDeleting(false);
    } catch (error) {
      add({
        name: '',
        title: 'Ошибка',
        content: error?.toString() ?? 'Ошибка',
        theme: 'danger',
      });
    }

    setDeleting(false);
  }, [key, type]);

  useEffect(() => {
    if (ref != null) {
      (ref as any).current = {
        open: (key: string, type: string) => {
          setKey(key);
          setType(type);
          setOpenDeleting(true);
        }
      };
    }
  }, [ref, setKey, setOpenDeleting])

  return (
    <Modal open={openDeleting} onClose={() => setOpenDeleting(false)}>
      <div className="flex flex-col gap-2 items-center p-4">
        <div className="w-full">
          Удалить?
        </div>
        <div className="w-full">
          {key}
        </div>
        <div className="w-full flex justify-between gap-2">
          <Button size="l" onClick={() => setOpenDeleting(false)}>Отмена</Button>
          <Button view="flat-danger" size="l" onClick={onDelete} loading={deleting}>Удалить</Button>
        </div>
      </div>
    </Modal>
  );
});
