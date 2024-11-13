"use client"

import React, { useCallback, useEffect, useRef, useState } from "react";
import {Overlay, Loader, Table, TableColumnConfig, TableDataItem, withTableActions, TableActionConfig, FirstDisplayedItemsCount, LastDisplayedItemsCount, useToaster, Button, Modal, TextInput} from '@gravity-ui/uikit';
import {Breadcrumbs} from '@gravity-ui/uikit';
import { useRouter } from "next/navigation";
import { useBreadcrumbs } from "@/app/hooks/breadcrumbs";
import { useDebouncedEffect } from "@/app/hooks/debounce";
import { ModalCreate, ModalCreateRef } from "@/app/modals/modal-create";
import { ModalDelete, ModalDeleteRef } from "@/app/modals/modal-delete";
import { useTorrentState } from "@/app/hooks/state";

const DataTable = withTableActions(Table);

const columns: TableColumnConfig<TableDataItem>[] = [
  {
    id: 'name',
    name: 'Имя',
  },
  {
    id: 'state',
    name: 'Состояние',
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

  const { searchParams, breadcrumbs, getParams } = useBreadcrumbs();

  const { loading, state, update } = useTorrentState(searchParams);

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
          <Button size="l" onClick={modalCreate.current?.open} disabled={loading}>Создать</Button>
        </div>
        <DataTable
          className="w-full [&>table]:w-full"
          data={state.torrents ?? []}
          columns={columns}
          getRowActions={getRowActions({
            onDelete: (item) => modalDelete.current?.open(item.key, item.type),
            onOpen: (item) => window.open(`/api/s3/get?${getParams(item.key)}`, '_blank'),
          })}
          onRowClick={item => {
            console.log(item);
          }}
        />
      </div>
      <Overlay visible={loading}>
        <Loader />
      </Overlay>
      <ModalDelete update={update} ref={modalDelete} />
      <ModalCreate update={update} ref={modalCreate} />
    </div>
  );
}
