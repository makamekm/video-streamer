"use client"

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Overlay, Loader, Table, TableColumnConfig, TableDataItem, withTableActions, TableActionConfig, FirstDisplayedItemsCount, LastDisplayedItemsCount, useToaster, Button, Modal, TextInput, Sheet } from '@gravity-ui/uikit';
import { Stop, Play } from '@gravity-ui/icons';
import { Breadcrumbs } from '@gravity-ui/uikit';
import { useBreadcrumbs } from "../../hooks/breadcrumbs";
import { useRouter } from "next/navigation";
import { useDebouncedEffect } from "../../hooks/debounce";
import { ModalCreate, ModalCreateRef } from "../../modals/modal-create";
import { ModalDelete, ModalDeleteRef } from "../../modals/modal-delete";
import { useFSState } from "@/app/hooks/state";

const DataTable = withTableActions(Table);

const columns: TableColumnConfig<TableDataItem>[] = [
  {
    id: 'name',
    name: 'Имя',
  },
  {
    id: 'date',
    name: 'Дата',
  },
];

const getRowActions = ({
  onDelete,
  onOpen,
}: {
  onDelete?: (item: TableDataItem) => void;
  onOpen?: (item: TableDataItem) => void;
}) => (item: TableDataItem, index: number) => {
  const items: TableActionConfig<TableDataItem>[] = [];

  if (onOpen && ['file'].includes(item.type)) items.push({
    text: 'Открыть',
    handler: () => onOpen?.(item),
  });

  if (onDelete && ['folder', 'file'].includes(item.type)) items.push({
    text: 'Удалить',
    handler: () => onDelete?.(item),
    theme: 'danger',
  });

  return items;
};

export default function Home() {
  const [url, setUrl] = useState('localhost');
  const stream = useFSState();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(window.location.hostname);
    }
  }, []);

  return (
    <div className="flex-1 relative mx-auto flex flex-col">
      <div className="flex-1 flex flex-col items-center">
        {/* <div className="w-full flex justify-end gap-2 p-2">
          <Button size="l" onClick={() => stream.setActive(true)} disabled={stream.active}>
            <div className="flex items-center gap-2">
              <Play />
              <div>
                Старт
              </div>
            </div>
          </Button>
          <Button size="l" onClick={() => stream.stop()}>
            <div className="flex items-center gap-2">
              <Stop />
              <div>
                Стоп
              </div>
            </div>
          </Button>
        </div> */}
        {/* <div className="flex flex-col-reverse gap-2 p-4">
          {stream.logs.map((log, index) => <div key={index}>{log}</div>)}
        </div> */}
        <iframe className="flex-1 w-full" src={`http://${url}:8080/`}>
        </iframe>
      </div>
    </div>
  );
}
