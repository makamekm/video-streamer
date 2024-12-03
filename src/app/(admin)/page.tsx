"use client"

import React, { useEffect, useRef, useState } from "react";
import {
  Button, Card, DropdownMenu, Loader, Overlay, Select, Sheet, Switch, TextInput

} from '@gravity-ui/uikit';
import { Equal, Ellipsis, Plus, Stop, ArrowRight, Play } from '@gravity-ui/icons';
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

import { usePlaylistState, useStreamState, useVideoMetaState, useVideoState } from "@/app/hooks/state";
import { Playlist, PlaylistItem, State } from "@/app/state";
import { ModalFromFolder, ModalFromFolderRef } from "@/app/modals/modal-from-folder";

function PlaceholderItem(props: {
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

function SortableItem(props: {
  id: string;
  active: boolean;
  item: PlaylistItem;
  onChange: (item: PlaylistItem) => void;
  children: JSX.Element;
  playlist: Playlist;
  playlists: Playlist[];
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

  const playlists = props.playlists.filter(p => p.id !== props.playlist.id);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="flex items-start w-full py-2 gap-2 px-2 !rounded-lg" view={"filled"} theme={props.active ? "success" : "normal"} size="l">
        <button className="px-2 py-3" ref={setActivatorNodeRef} {...listeners}>
          <Equal />
        </button>
        <div className="flex-1 flex flex-col gap-2">
          {
            props.item.type === 'playlist'
              ? <Select
                size="l"
                placeholder="Плейлист"
                value={props.item.key != null && !!playlists.find(p => p.id === props.item.key) ? [props.item.key] : []}
                onUpdate={value => {
                  props.item.key = value[0];
                  props.onChange(props.item);
                }}
                options={playlists.map(playlist => ({
                  value: playlist.id,
                  content: playlist.name,
                }))}
              />
              : <>
                <TextInput
                  size="l"
                  placeholder="Ключ"
                  value={props.item.key}
                  onUpdate={value => {
                    props.item.key = value;
                    props.onChange(props.item);
                  }}
                />
                <TextInput
                  size="l"
                  placeholder="Начало сек."
                  type="number"
                  value={String(props.item.initialTime || 0)}
                  onUpdate={value => {
                    props.item.initialTime = Number.parseFloat(value);
                    props.onChange(props.item);
                  }}
                />
              </>
          }
        </div>
        <Select
          value={[props.item.type]}
          onUpdate={value => {
            props.item.type = value[0];
            props.item.key = '';
            props.onChange(props.item);
          }}
          options={[
            { value: 'file', content: 'Файл' },
            { value: 'playlist', content: 'Плейлист' },
          ]}
          size="l"
        />
        <div className="py-1">
          {props.children}
        </div>
      </Card>
    </div>
  );
}

function rnd() {
  return (Math.random() * 1000000).toFixed().toString();
}

function toTime(totalSeconds?: number | null) {
  totalSeconds = totalSeconds ?? 0;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return [hours, minutes, seconds]
    .map(v => v < 10 ? "0" + v : v)
    .join(":");
}

export default function MdFile() {
  const modalFromFolder = useRef<ModalFromFolderRef>(null);
  // const [seek, setSeek] = useState(0);
  const [visible, setVisible] = React.useState(false);
  const video = useVideoState();
  const stream = useStreamState();
  const playlist = usePlaylistState();
  const meta = useVideoMetaState(video.state.video?.key);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
  );

  const [activeItem, setActiveItem] = useState<PlaylistItem | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    if (!playlists?.length && !!playlist.state.playlists?.length) {
      setPlaylists(playlist.state.playlists.map(playlist => {
        playlist.id = playlist.id ?? rnd();
        playlist.items = playlist.items.map(item => {
          item.id = item.id ?? rnd();
          return item;
        })
        return playlist;
      }));
    }
  }, [playlist.state.playlists]);

  const [configVisible, setConfigVisible] = React.useState(false);
  const [config, setConfig] = useState<State>({});

  useEffect(() => {
    setConfig({
      url: video.state.url,
      uiUrl: video.state.uiUrl,
      width: video.state.width,
      height: video.state.height,
      preset: video.state.preset,
      videoBitrate: video.state.videoBitrate,
      buffSize: video.state.buffSize,
      audioBitrate: video.state.audioBitrate,
      qualityCF: video.state.qualityCF,
      framerate: video.state.framerate,
      gbuffer: video.state.gbuffer,
      keyColor: video.state.keyColor,
      keySimilarity: video.state.keySimilarity,
      keyBlend: video.state.keyBlend,
      args: video.state.args,
    });
  }, [
    video.state.url,
    video.state.uiUrl,
    video.state.width,
    video.state.height,
    video.state.preset,
    video.state.videoBitrate,
    video.state.buffSize,
    video.state.audioBitrate,
    video.state.qualityCF,
    video.state.framerate,
    video.state.gbuffer,
    video.state.keyColor,
    video.state.keySimilarity,
    video.state.keyBlend,
    video.state.args,
  ]);

  const currentVideo = video.state.video;
  const currentPlaylist = playlists.find(p => p.id === video.state.video?.playlistKey);

  return (
    <div className="flex-1 flex flex-col relative container mx-auto px-2 py-2 min-h-[100%]">
      <div className="flex-1 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center w-full gap-3">
          <Button size="l" onClick={() => video.next({
            finish: true,
          })}>
            <div className="flex items-center gap-2">
              <ArrowRight />
              <div>
                Далее
              </div>
            </div>
          </Button>
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
          <Button size="l" onClick={() => setVisible(true)} disabled={!stream.logs?.length}>Консоль</Button>
          <Sheet visible={visible} onClose={() => setVisible(false)}>
            <div className="flex flex-col-reverse gap-2 p-4">
              {stream.logs.map((log, index) => <div key={index}>{log}</div>)}
            </div>
          </Sheet>
          <Button size="l" onClick={() => setConfigVisible(true)}>Конфиг</Button>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Card className="inline-flex items-center w-full py-3 px-4 gap-2 !rounded-lg" theme="info" view="filled" size="l">
            Видео: {currentVideo?.key || "<Нету>"}
          </Card>
          <Card className="flex items-center w-full py-3 px-4 gap-2 !rounded-lg" theme="info" view="filled" size="l">
            Плейлист: {currentPlaylist?.name || "<Нету>"}
          </Card>
          <Card className="flex items-center w-full py-3 px-4 gap-2 !rounded-lg" theme="info" view="filled" size="l">
            Время: {video.state.currentTime ? toTime(video.state.currentTime) : "<Нету>"} - {(video.state.currentTime ?? 0)?.toFixed()} сек.
            {/* Время: {video.state.currentTime ? toTime(video.state.currentTime) : "<Нету>"} - {(video.state.currentTime ?? 0)?.toFixed()} сек. / ({toTime(seek)}) */}
          </Card>
          <Card className="flex items-center w-full py-3 px-4 gap-2 !rounded-lg" theme="info" view="filled" size="l">
            Прогресс: {toTime(video.state.currentTime)} / {toTime(meta.state.duration ?? 0)} ({video.state.currentTime?.toFixed()} / {(meta.state.duration ?? 0).toFixed()})
          </Card>
          <Card className="flex items-center w-full py-3 px-4 gap-2 !rounded-lg" theme="info" view="filled" size="l">
            <Select
              className="w-full"
              size="l"
              placeholder="Плейлист"
              value={video.state.defaultPlaylist != null && !!playlists.find(p => p.id === video.state.defaultPlaylist) ? [video.state.defaultPlaylist] : []}
              onUpdate={value => {
                video.apply({
                  defaultPlaylist: value[0],
                })
              }}
              options={playlists.map(playlist => ({
                value: playlist.id,
                content: playlist.name,
              }))}
            />
          </Card>
          {/* <div className="flex gap-2">
            <TextInput
              className="max-w-[200px]"
              size="l"
              placeholder="Начало сек."
              type="number"
              value={String(seek || 0)}
              onUpdate={value => {
                const num = Number.parseFloat(value);
                setSeek(num);
              }}
            />
            <Button size="l" onClick={() => video.apply({
              seek: seek,
              events: [['refresh']],
            })}>Перемотать</Button>
          </div> */}
          <div className="flex flex-wrap gap-2">
            <Button size="l" onClick={() => modalFromFolder.current?.open()}>Плейлист из папки</Button>
            <Button size="l" onClick={() => playlist.apply({
              playlists,
            })}>Сохранить плейлисты</Button>
          </div>
        </div>

        <div className="flex gap-2 w-full overflow-x-auto max-w-full">
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
                    <TextInput
                      size="l" placeholder="Ключ" value={playlist.name} onUpdate={value => {
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
                      active={item.id === currentVideo?.id}
                      key={item.id}
                      id={index + ':' + item.id}
                      item={item}
                      onChange={item => {
                        playlists[index].items[i] = item;
                        setPlaylists([...playlists]);
                      }}
                      playlists={playlists}
                      playlist={playlists[index]}
                    >
                      <DropdownMenu
                        items={[
                          {
                            action: () => {
                              video.next({
                                video: item,
                                playlistKey: playlists[index].id,
                              });
                            },
                            text: 'Запустить',
                            theme: 'normal',
                          },
                          {
                            action: () => {
                              video.next({
                                video: item,
                                playlistKey: playlists[index].id,
                                replay: true,
                              });
                            },
                            text: 'Перезапустить',
                            theme: 'normal',
                          },
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
      </div>
      <ModalFromFolder update={(data) => {
        playlist.setState(data);
        setPlaylists(data.playlists ?? playlists);
      }} ref={modalFromFolder} />
      <Sheet visible={configVisible} onClose={() => setConfigVisible(false)}>
        <div className="flex flex-col gap-2 container m-auto">
          <TextInput
            className="w-full"
            size="l"
            placeholder="Ссылка на стрим"
            value={config?.url}
            onUpdate={value => {
              setConfig(state => ({ ...state, url: value }));
            }}
          />
          <TextInput
            className="w-full"
            size="l"
            placeholder="Ссылка на оверлей"
            value={config?.uiUrl}
            onUpdate={value => {
              setConfig(state => ({ ...state, uiUrl: value }));
            }}
          />
          <TextInput
            className="w-full"
            size="l"
            placeholder="Ширина (1920)"
            value={config?.width}
            onUpdate={value => {
              setConfig(state => ({ ...state, width: value }));
            }} />
          <TextInput
            className="w-full"
            size="l"
            placeholder="Высота (1080)"
            value={config?.height}
            onUpdate={value => {
              setConfig(state => ({ ...state, height: value }));
            }} />
          <TextInput
            className="w-full"
            size="l"
            placeholder="Пресет (ultrafast)"
            value={config?.preset}
            onUpdate={value => {
              setConfig(state => ({ ...state, preset: value }));
            }} />
          <TextInput
            className="w-full"
            size="l"
            placeholder="Видео битрейт (10000k)"
            value={config?.videoBitrate}
            onUpdate={value => {
              setConfig(state => ({ ...state, videoBitrate: value }));
            }} />
          <TextInput
            className="w-full"
            size="l"
            placeholder="Размер буфера (20000k)"
            value={config?.buffSize}
            onUpdate={value => {
              setConfig(state => ({ ...state, buffSize: value }));
            }} />
          <TextInput
            className="w-full"
            size="l"
            placeholder="Аудио битрейт (128k)"
            value={config?.audioBitrate}
            onUpdate={value => {
              setConfig(state => ({ ...state, audioBitrate: value }));
            }} />
          <TextInput
            className="w-full"
            size="l"
            placeholder="Качество (24)"
            value={config?.qualityCF}
            onUpdate={value => {
              setConfig(state => ({ ...state, qualityCF: value }));
            }} />
          <TextInput
            className="w-full"
            size="l"
            placeholder="Фреймрейт (24)"
            value={config?.framerate}
            onUpdate={value => {
              setConfig(state => ({ ...state, framerate: value }));
            }} />
          <TextInput
            className="w-full"
            size="l"
            placeholder="GBuffer (48)"
            value={config?.gbuffer}
            onUpdate={value => {
              setConfig(state => ({ ...state, gbuffer: value }));
            }} />
          <TextInput
            className="w-full"
            size="l"
            placeholder="Ключ цвет (00FF00)"
            value={config?.keyColor}
            onUpdate={value => {
              setConfig(state => ({ ...state, keyColor: value }));
            }} />
          <TextInput
            className="w-full"
            size="l"
            placeholder="Ключ схожесть (0.45)"
            value={config?.keySimilarity}
            onUpdate={value => {
              setConfig(state => ({ ...state, keySimilarity: value }));
            }} />
          <TextInput
            className="w-full"
            size="l"
            placeholder="Ключ смешивание (0.1)"
            value={config?.keyBlend}
            onUpdate={value => {
              setConfig(state => ({ ...state, keyBlend: value }));
            }} />
          <TextInput
            className="w-full"
            size="l"
            placeholder="Дополнительные аргументы (Пусто)"
            value={config?.args}
            onUpdate={value => {
              setConfig(state => ({ ...state, args: value }));
            }} />
          <Button
            size="l"
            onClick={() => video.apply({
              ...config,
            })}>Сохранить</Button>
        </div>
      </Sheet>
      {/* <Overlay visible={video.loading || playlist.loading}>
        <Loader />
      </Overlay> */}
    </div>
  );
}
