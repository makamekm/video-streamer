"use client"

import React, { useCallback, useEffect, useRef, useState } from "react";
import {Overlay, Loader, Table, TableColumnConfig, TableDataItem, withTableActions, TableActionConfig, FirstDisplayedItemsCount, LastDisplayedItemsCount, useToaster, Button, Modal, TextInput} from '@gravity-ui/uikit';
import {Breadcrumbs} from '@gravity-ui/uikit';
import { useBreadcrumbs } from "../../hooks/breadcrumbs";
import { useRouter } from "next/navigation";
import { useDebouncedEffect } from "../../hooks/debounce";
import { ModalCreate, ModalCreateRef } from "../../modals/modal-create";
import { ModalDelete, ModalDeleteRef } from "../../modals/modal-delete";

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
  const modalCreate = useRef<ModalCreateRef>(null);
  const modalDelete = useRef<ModalDeleteRef>(null);

  const { add } = useToaster();
  const router = useRouter();
  const { searchParams, breadcrumbs, bucket, path, updateParams, getParams } = useBreadcrumbs();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    name: string;
    key: string;
    type: 'bucket' | 'folder' | 'file';
  }[]>([]);
 
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const result = await fetch(`/api/s3?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        signal: AbortSignal.timeout(5000),
      }).then(response => response.json());

      if (Array.isArray(result)) {
        setData(result);
      }
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

  useEffect(() => {
    setLoading(true);
  }, [fetchData]);

  useDebouncedEffect(() => {
    fetchData();
  }, [fetchData], 1000);

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
          <Button size="l" onClick={modalCreate.current?.open} disabled={loading || !bucket}>Создать</Button>
        </div>
        <DataTable
          className="w-full [&>table]:w-full"
          data={data}
          columns={columns}
          getRowActions={getRowActions({
            onDelete: (item) => modalDelete.current?.open(item.key, item.type),
            onOpen: (item) => window.open(`/api/s3/get?${getParams(bucket, item.key)}`, '_blank'),
          })}
          onRowClick={item => {
            if (item.type === 'bucket') {
              updateParams(item.key, path);
            } else if (item.type === 'folder') {
              updateParams(bucket, item.key);
            } else if (item.type === 'file' && ['md'].includes(item.ext)) {
              router.push(`/md?${getParams(bucket, item.key)}`);
            } else if (item.type === 'file' && ['yaml', 'yml', 'yfm'].includes(item.ext)) {
              router.push(`/yaml?${getParams(bucket, item.key)}`);
            } else if (item.type === 'file' && ['json'].includes(item.ext)) {
              router.push(`/json?${getParams(bucket, item.key)}`);
            } else if (item.type === 'file' && ['mp4'].includes(item.ext)) {
              router.push(`/video?${getParams(bucket, item.key)}`);
            } else {
              window.open(`/api/s3/get?${getParams(bucket, item.key)}`, '_blank');
            }
          }}
        />
      </div>
      <Overlay visible={loading}>
        <Loader />
      </Overlay>
      <ModalDelete update={fetchData} ref={modalDelete} />
      <ModalCreate update={fetchData} ref={modalCreate} />
    </div>
  );
}
