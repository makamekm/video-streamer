"use client"

import React, { useEffect, useState } from "react";
import { Button, Card, DropdownMenu, Loader, Overlay, Select, Switch, TextInput } from '@gravity-ui/uikit';
import { Equal, Ellipsis, Plus, ArrowRotateLeft, ArrowRight, Play } from '@gravity-ui/icons';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  TouchSensor,
  MouseSensor,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useBreadcrumbs } from "@/app/hooks/breadcrumbs";
import { useVideoState } from "@/app/hooks/state";
import { Playlist, PlaylistItem } from "@/app/state";

export function PlaceholderItem(props: {
  item: PlaylistItem;
}) {

  return (
    <Card className="flex items-center w-full py-2 gap-2 px-2 !rounded-lg pointer-events-none" theme="info" view="filled" size="l">
      <button className="p-2">
        <Equal />
      </button>
      <div className="flex-1">
        <TextInput
          size="l"
          placeholder="Ключ"
          value={props.item.key}
          disabled
        />
      </div>
      <button className="p-2">
        <Ellipsis />
      </button>
    </Card>
  );
}

export function SortableItem(props: {
  id: string;
  item: PlaylistItem;
  onChange: (item: PlaylistItem) => void;
  children: JSX.Element;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="flex items-center w-full py-2 gap-2 px-2 !rounded-lg" view="filled" size="l">
        <button className="p-2" ref={setActivatorNodeRef} {...listeners}>
          <Equal />
        </button>
        <div className="flex-1 flex flex-col gap-2">
          <TextInput
            size="l"
            placeholder="Ключ"
            value={props.item.key}
            onUpdate={value => {
              props.item.key = value;
              props.onChange(props.item);
            }}
          />
        </div>
        <Select
          value={[props.item.type]}
          onUpdate={value => {
            props.item.type = value[0];
            props.onChange(props.item);
          }}
          options={[
            { value: 'file', content: 'Файл' },
            { value: 'playlist', content: 'Плейлист' },
          ]}
          size="l"
        />
        {props.children}
      </Card>
    </div>
  );
}

function rnd() {
  return (Math.random() * 1000000).toFixed().toString();
}

export default function MdFile() {
  const { searchParams } = useBreadcrumbs();
  const { state, apply, next, loading } = useVideoState(searchParams);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
  );

  const [activeItem, setActiveItem] = useState<PlaylistItem | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    if (!playlists?.length && !!state.playlists?.length) {
      setPlaylists(state.playlists.map(playlist => {
        playlist.id = playlist.id ?? rnd();
        playlist.items = playlist.items.map(item => {
          item.id = item.id ?? rnd();
          return item;
        })
        return playlist;
      }));
    }
  }, [state.playlists]);

  return (
    <div className="flex-1 flex flex-col relative container mx-auto px-2 py-2 min-h-[100%]">
      <div className="flex-1 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center w-full gap-3">
          <Switch className="flex items-center [&>*]:my-1" size="l" checked={state.isPlaying ?? false} onUpdate={(value) => apply({
            ...state,
            isPlaying: value,
          })
          }>
            <div className="flex items-center gap-2">
              <Play />
              <div>
                Играть/Пауза
              </div>
            </div>
          </Switch>
          <Button size="l" onClick={() => apply({
            ...state,
            events: [...(state.events ?? []), ['reload']],
          })}>
            <div className="flex items-center gap-2">
              <ArrowRotateLeft />
              <div>
                Перезагрузить
              </div>
            </div>
          </Button>
          <Button size="l" onClick={() => next(true)}>
            <div className="flex items-center gap-2">
              <ArrowRight />
              <div>
                Далее
              </div>
            </div>
          </Button>
        </div>
        <div className="flex gap-2 w-full overflow-x-auto max-w-full p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(event: DragStartEvent) => {
              const { active } = event;
              const [indexActive, keyActive] = active.id.toString().split(':') as [number, string];
              const item = playlists[indexActive].items.find(item => item.id === keyActive);
              setActiveItem(item ?? null);
            }}
            onDragEnd={(event: DragEndEvent) => {
              const { active, over } = event;
              const [indexActive, keyActive] = active.id.toString().split(':') as [number, string];
              const [indexOver, keyOver] = over!.id.toString().split(':') as [number, string];
              if (keyActive !== keyOver && indexActive === indexOver) {
                const item = playlists[indexActive].items.find(item => item.id === keyActive);
                const oldIndex = playlists[indexActive].items.findIndex(item => item.id === keyActive);
                const newIndex = playlists[indexActive].items.findIndex(item => item.id === keyOver);
                playlists[indexActive].items.splice(oldIndex, 1);
                playlists[indexActive].items.splice(newIndex, 0, item!);
                setPlaylists([...playlists]);
              } else if (keyActive !== keyOver && indexActive !== indexOver) {
                if (!playlists[indexOver].items.find(item => item.id === keyActive)) {
                  const item = playlists[indexActive].items.find(item => item.id === keyActive);
                  const oldIndex = playlists[indexActive].items.findIndex(item => item.id === keyActive);
                  const newIndex = playlists[indexOver].items.findIndex(item => item.id === keyOver);
                  playlists[indexActive].items.splice(oldIndex, 1);
                  playlists[indexActive].items = [...playlists[indexActive].items];
                  playlists[indexOver].items.splice(newIndex, 0, item!);
                  playlists[indexOver].items = [...playlists[indexOver].items];
                  setPlaylists([...playlists]);
                }
              }
              setActiveItem(null);
            }}
          >
            {
              playlists?.map((playlist, index) => {
                return <div key={playlist.id} id={playlist.id} className="flex flex-col gap-2 min-w-[400px]">
                  <Card className="flex items-center w-full py-2 gap-2 px-2 !rounded-lg" theme="info" view="filled" size="l">
                    <TextInput size="l" placeholder="Ключ" value={playlist.name} onUpdate={value => {
                      playlists[index].name = value;
                      setPlaylists([...playlists]);
                    }} />
                    <DropdownMenu
                      items={[
                        {
                          action: () => {
                            playlists.splice(index, 1);
                            setPlaylists([...playlists]);
                          },
                          text: 'Удалить',
                          theme: 'danger',
                        },
                      ]}
                    />
                  </Card>
                  <SortableContext
                    items={playlist.items.map(item => index + ':' + item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {playlist.items.map((item, i) => <SortableItem
                      key={item.id}
                      id={index + ':' + item.id}
                      item={item}
                      onChange={item => {
                        playlists[index].items[i] = item;
                        setPlaylists([...playlists]);
                      }}
                    >
                      <DropdownMenu
                        items={[
                          {
                            action: () => {
                              playlists[index].items.splice(i, 1);
                              setPlaylists([...playlists]);
                            },
                            text: 'Удалить',
                            theme: 'danger',
                          },
                        ]}
                      />
                    </SortableItem>)}
                  </SortableContext>
                  <Card className="flex items-center w-full py-2 gap-2 px-2 !rounded-lg" theme="normal" view="filled" size="l">
                    <div className="flex-1">
                      <Button className="w-full flex items-center" size="l" onClick={() => {
                        playlists[index].items.push({
                          id: rnd(),
                          key: '',
                          type: 'file',
                        });
                        setPlaylists([...playlists]);
                      }} view="flat"><Plus /></Button>
                    </div>
                  </Card>
                </div>;
              })
            }

            <Card className="flex flex-col items-center py-2 gap-2 px-2 !rounded-lg" theme="normal" view="filled" size="l">
              <div className="flex-1">
                <Button className="w-full flex items-center" size="l" onClick={() => {
                  playlists.push({
                    id: rnd(),
                    name: '',
                    items: [],
                  });
                  setPlaylists([...playlists]);
                }} view="flat"><Plus /></Button>
              </div>
            </Card>
            <DragOverlay>
              {activeItem ? <PlaceholderItem item={activeItem} /> : null}
            </DragOverlay>
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
