"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Table, TableColumnConfig, TableDataItem, withTableActions, TableActionConfig, FirstDisplayedItemsCount, LastDisplayedItemsCount, useToaster, Button, Modal, TextInput } from '@gravity-ui/uikit';
import { ModalTorrent, ModalTorrentRef } from "@/app/modals/modal-torrent";

const DataTable = withTableActions(Table);

const columns: TableColumnConfig<TableDataItem>[] = [
  {
    id: 'name',
    name: 'Имя',
  },
  {
    id: 'size',
    name: 'Вес',
  },
  {
    id: 'downloadSpeed',
    name: 'Скорость',
  },
  {
    id: 'uploadedPercent',
    name: 'Загрузка',
  },
  {
    id: 'downloadPercent',
    name: 'Статус',
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

interface ResponseData {
  id: string;
  name: string;
  response: Response;
  files: Map<string, {
    path: string;
    length: number;
    size: string;
    downloaded: number;
    downloadedTotal: number;
    downloadSpeed: string;
    downloadedPercent: string;
    uploaded: number
    uploadedTotal: number;
    uploadedPercent: string;
  }>;
}

function rnd() {
  return (Math.random() * 1000000).toFixed().toString();
}

export default function Home() {
  const modalTorrent = useRef<ModalTorrentRef>(null);
  const [data, setData] = useState<ResponseData[]>([]);

  const update = async (response: Response) => {
    if (!response.body) return;

    const id = rnd();
    const item: ResponseData = {
      id: id,
      name: id,
      response,
      files: new Map(),
    };
    setData(data => [...data, item]);

    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader();

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      const values = value?.split('\n') ?? [];
      for (const value of values) {
        if (value) {
          try {
            const json = JSON.parse(value);
            switch (json.type) {
              case 'file':
                item.files.set(json.path, {
                  ...item.files.get(json.path),
                  ...json,
                })
                setData(data => [...data]);
                break;
              default:
            }
          } catch (error) {
            console.error(error);
          }
        }
      }
    }

    setData(data => data.filter(item => item.id !== id));
  }

  const fileData = useMemo(() => data.reduce<any>((arr, item) => {
    arr.push({
      name: item.name,
    });

    for (const file of item.files.values()) {
      arr.push({
        name: file.path,
        ...file,
      });
    }

    return arr;
  }, []), [data]);

  return (
    <div className="relative container mx-auto px-2 py-2">
      <div className="flex flex-col gap-2 items-center">
        <div className="w-full flex justify-end gap-2">
          <Button size="l" onClick={() => {
            modalTorrent.current?.open();
          }}>Загрузить</Button>
        </div>
        <DataTable
          className="w-full [&>table]:w-full"
          data={fileData}
          columns={columns}
          getRowActions={getRowActions({
            // onDelete: (item) => modalDelete.current?.open(item.key, item.type),
            // onOpen: (item) => window.open(`/api/s3/get?${getParams(item.key)}`, '_blank'),
          })}
          onRowClick={item => {
            console.log(item);
          }}
        />
      </div>
      <ModalTorrent update={update} ref={modalTorrent} />
    </div>
  );
}
