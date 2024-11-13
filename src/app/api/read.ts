import * as mime from 'mime-types';
import { getS3 } from './storage';
import { State } from '../state';

export async function readJSON<T>(path: string, value: T, bucket?: string) {
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

export async function saveJSON<T>(path: string, value: T, bucket?: string) {
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

export async function nextVideo(state: State, next = false, file?: string) {
  const playlist = state.playlist ?? [];
  let played = state.played ?? [];
  
  if (next && state.current != null) {
    if (!played.includes(state.current)) {
      played.push(state.current);
    }
    state.played = played;
    state.current = undefined;

    await saveJSON('state.json', state);
  }
  
  if (file != null) {
    played = played.filter(f => f !== file);
    state.played = played;
    state.current = file;

    await saveJSON('state.json', state);
  }

  if (state.current == null) {
    for (const item of playlist) {
      if (!played.includes(item)) {
        state.current = item;
        break;
      }
    }

    if (state.current != null) {
      await saveJSON('state.json', state);
    }
  }

  if (state.current == null && playlist.length > 0) {
    state.played = [];
    state.current = playlist[0];

    await saveJSON('state.json', state);
  }

  return state;
}
