"use client"

import React, { useEffect, useState } from "react";
import {Button, Card, Loader, Overlay, Switch, TextInput} from '@gravity-ui/uikit';
import {
  DndContext, 
  closestCenter,
  useSensor,
  useSensors,
  TouchSensor,
  MouseSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

import {useBreadcrumbs} from "@/app/hooks/breadcrumbs";
import { useVideoState } from "@/app/hooks/state";

export function SortableItem(props: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: props.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="flex items-center w-full py-2 gap-2 px-2 !rounded-lg" theme="info" view="filled" size="l">
        <div className="flex-1 pl-2">{props.children}</div>
        <Button size="l" onClick={() => {}} view="flat-danger">Д</Button>
      </Card>
    </div>
  );
}

export default function MdFile() {
  const {searchParams} = useBreadcrumbs();
  const {state, apply, next, loading} = useVideoState(searchParams);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
  );

  const [playlists, setPlaylists] = useState([
    {
      id: '0',
      name: 'sdfdsaf',
      items: [{key: 'dsfasdf43'}, {key: 'dfsgdf2'}, {key: 'as4das'}, {key: 'fgfdfg3fd'}],
    },
    {
      id: '1',
      name: '234dssdfd',
      items: [{key: 'dsfatre1sdf'}, {key: 'dfsds4gdf'}, {key: 'asre1das'}, {key: 'fgfdd3fgfd'}],
    },
    {
      id: '2',
      name: 'fdsdfsdf3243',
      items: [{key: 'dsf12asdf'}, {key: 'dfsgds3df'}, {key: 'as45sdas'}, {key: 'fgfdffs23gfd'}],
    },
  ]);

  useEffect(() => {
    if (!playlists?.length && !!state.playlists?.length) {
      setPlaylists(state.playlists);
    }
  }, [state.playlists]);

  return (
    <div className="flex-1 flex flex-col relative container mx-auto px-2 py-2 min-h-[100%]">
      <div className="flex-1 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center w-full gap-2">
          <Switch size="l" checked={state.isPlaying ?? false} onUpdate={(value) => apply({
              ...state,
              isPlaying: value,
            })
          }>Играть/Пауза</Switch>
          <Button size="l" onClick={() => apply({
            ...state,
            events: [...(state.events ?? []), ['reload']],
          })}>Перезагрузить</Button>
          <Button size="l" onClick={() => next(true)}>Далее</Button>
        </div>
        <div className="flex gap-2 w-full overflow-x-auto max-w-full p-4">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event: DragEndEvent) => {
                const {active, over} = event;
                const [indexActive, keyActive] = active.id.toString().split(':') as [number, string];
                const [indexOver, keyOver] = over!.id.toString().split(':') as [number, string];
                if (keyActive !== keyOver && indexActive === indexOver) {
                  const item = playlists[indexActive].items.find(item => item.key === keyActive);
                  const oldIndex = playlists[indexActive].items.findIndex(item => item.key === keyActive);
                  const newIndex = playlists[indexActive].items.findIndex(item => item.key === keyOver);
                  playlists[indexActive].items.splice(oldIndex, 1);
                  playlists[indexActive].items.splice(newIndex, 0, item!);
                  setPlaylists([...playlists]);
                } else if (keyActive !== keyOver && indexActive !== indexOver) {
                  if (!playlists[indexOver].items.find(item => item.key === keyActive)) {
                    const item = playlists[indexActive].items.find(item => item.key === keyActive);
                    const oldIndex = playlists[indexActive].items.findIndex(item => item.key === keyActive);
                    const newIndex = playlists[indexOver].items.findIndex(item => item.key === keyOver);
                    playlists[indexActive].items.splice(oldIndex, 1);
                    playlists[indexActive].items = [...playlists[indexActive].items];
                    playlists[indexOver].items.splice(newIndex, 0, item!);
                    playlists[indexOver].items = [...playlists[indexOver].items];
                    setPlaylists([...playlists]);
                  }
                }
              }}
          >
          {
            playlists?.map((playlist, index) => {
              return <div key={playlist.id} id={playlist.id} className="flex flex-col gap-2 min-w-[100px]">
                <div className="flex gap-2 items-center">
                  <Switch size="l"></Switch>
                  <TextInput size="l" placeholder="Placeholder" value={playlist.name} onUpdate={value => {
                    playlists[index].name = value;
                    setPlaylists([...playlists]);
                  }} />
                  <Button size="l" onClick={() => next(true)} view="flat-danger">Д</Button>
                </div>
                <SortableContext
                  items={playlist.items.map(item => index + ':' + item.key)}
                  strategy={verticalListSortingStrategy}
                >
                  {playlist.items.map(item => <SortableItem key={item.key} id={index + ':' + item.key}>{item.key}</SortableItem>)}
                </SortableContext>
              </div>;
            })
          }
          </DndContext>
        </div>
        <div className="flex items-center justify-center w-full gap-2">
          <Button size="l" onClick={() => apply({
            playlists,
          })}>Сохранить</Button>
        </div>
      </div>
      <Overlay visible={loading}>
        <Loader />
      </Overlay>
    </div>
  );
}
