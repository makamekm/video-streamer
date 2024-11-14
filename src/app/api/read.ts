import * as mime from 'mime-types';
import { getS3 } from './storage';
import { PlaylistItem, PlaylistState, State, Video } from '../state';

export async function readJSON<T>(path: string, value: T, bucket?: string): Promise<T> {
  bucket = bucket ?? process.env.STORAGE_BUCKET;

  const s3 = await getS3();

  let json: any = value;

  try {
    const value = await s3.getObject({
      Bucket: bucket!,
      Key: path,
    });
    const text = await value.Body?.transformToString();
    json = JSON.parse(text ?? "{}");
    
  } catch (error) {
    console.log(error);
  }

  return json;
}

export async function saveJSON<T>(path: string, value: T, bucket?: string): Promise<T> {
  bucket = bucket ?? process.env.STORAGE_BUCKET;

  const s3 = await getS3();

  try {
    await s3.putObject({
      Bucket: bucket,
      Key: path,
      ContentType: mime.lookup(path) || undefined,
      Body: JSON.stringify(value),
    });
  } catch (error) {
    console.log(error);
  }

  return value;
}

export function findNextVideo(state: State, playlistState: PlaylistState, playlistKey: string): Video | null {
  const playlist = playlistState.playlists?.find(p => p.id === playlistKey);
  const playlistItems = playlist?.items ?? [];

  for (const item of playlistItems) {
    if (!state.played?.includes(item.id)) {
      if (item.type === 'playlist') {
        state.played?.push(item.id);
        return findNextVideo(state, playlistState, item.key);
      } else {
          return {
            playlistKey: playlist?.id,
            key: item.key,
            id: item.id,
            initialTime: item.initialTime,
          };
        }
    }
  }

  return null;
}

export async function nextVideo(state: State, bucket: string, {
  finish,
  reset,
  video,
  playlistKey,
  replay,
}: {
  finish?: boolean;
  reset?: boolean;
  video?: PlaylistItem;
  playlistKey?: string;
  replay?: boolean;
} = {}) {
  const playlistState = await readJSON<PlaylistState>('playlist.json', {}, bucket);

  state.played = state.played ?? [];
  let update = false;
  
  if (finish) {
    if (state.video?.id != null && !state.played.includes(state.video.id)) {
      state.played.push(state.video.id);

      update = true;
    }
  }
  
  if (video != null) {
    const playlist = playlistState.playlists?.find(p => p.id === playlistKey);
    const i = playlist?.items.findIndex(item => item.id === video.id) ?? -1;
    state.played = !replay && i >= 0 ? (playlist?.items.reduce<string[]>((arr, item, index) => {
      if (index < i) {
        arr.push(item.id);
      }
      return arr;
    }, []) ?? []) : state.played.filter(f => f !== video.id);
    state.video = {
      playlistKey: playlistKey,
      key: video.key,
      id: video.id,
      initialTime: video.initialTime,
    };
    state.seek = state.video?.initialTime ?? 0;

    update = true;
  } else if (finish) {
    if (state.video?.playlistKey != null) {
      state.video = findNextVideo(state, playlistState, state.video.playlistKey);
    } else {
      state.video = null;
    }
    state.seek = state.video?.initialTime ?? 0;

    if (state.video != null) {
      update = true;
    }
  }

  if (reset) {
    state.played = [];

    update = true;
  }

  if (state.video == null && state.defaultPlaylist) {
    state.played = [];
    state.video = findNextVideo(state, playlistState, state.defaultPlaylist);
    state.seek = state.video?.initialTime ?? 0;

    if (state.video != null) {
      update = true;
    }
  }

  if (update) {
    await saveJSON('state.json', state);
  }

  return state;
}
