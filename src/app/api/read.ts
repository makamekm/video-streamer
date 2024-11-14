import * as mime from 'mime-types';
import { getS3 } from './storage';
import { PlaylistState, State, Video } from '../state';

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

export async function nextVideo(state: State, bucket?: string, next = false, video?: Video) {
  const playlistState = await readJSON<PlaylistState>('playlist.json', {}, bucket);

  const playlist = playlistState.playlists?.find(p => p.id === state.video?.playlistKey);
  const playlistItems = playlist?.items ?? [];

  let played = state.played ?? [];
  
  if (next && state.video?.key != null) {
    if (!played.includes(state.video?.key)) {
      played.push(state.video?.key);
    }
    state.played = played;
    state.video = undefined;

    await saveJSON('state.json', state);
  }
  
  if (video != null) {
    played = played.filter(f => f !== video.key);
    state.played = played;
    state.video = video;

    await saveJSON('state.json', state);
  }

  if (state.video?.key == null) {
    for (const item of playlistItems) {
      if (!played.includes(item.key)) {
        state.video = {
          currentTime: 0,
          key: item.key,
          playlistKey: playlist?.id,
        };
        break;
      }
    }

    if (state.video?.key != null) {
      await saveJSON('state.json', state);
    }
  }

  if (state.video?.key == null && playlist != null && playlistItems.length > 0) {
    state.played = [];
    state.video = {
      currentTime: 0,
      key: playlistItems[0].key,
      playlistKey: playlist?.id,
    };

    await saveJSON('state.json', state);
  }

  return state;
}
