import { DependencyList, useCallback, useEffect, useMemo, useState } from "react";
import { PlaylistState, State, TorrentState } from "../state";

export const useServerState = (url: string, body: any, fn: (data: string) => void | Promise<void>, deps: DependencyList = []) => {
  const [loading, setLoading] = useState(true);
  const [inited, setInited] = useState(false);
  const [counter, setCounter] = useState(0);

  const controllState = useMemo<{
    canListening: boolean;
    isListening: boolean;
    reader: ReadableStreamDefaultReader<string> | null
  }>(() => ({
    canListening: true,
    isListening: false,
    reader: null,
  }), [body, counter]);

  const startListening = useCallback(async () => {
    controllState.isListening = true;

    try {
      setLoading(true);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/event-stream",
        },
        body: JSON.stringify(body ?? {}),
      });

      setLoading(false);
      setInited(true);

      if (!response.body) return;

      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();

      controllState.reader = reader;

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        if (value) {
          try {
            fn?.(value);
          } catch (error) {
            //
          }
        }
      }
    } catch (error) {
      console.error(error);
    }

    controllState.reader = null;
    controllState.isListening = false;
  }, [controllState, url, ...deps]);

  const updateState = useCallback(async () => {
    if (!controllState.isListening && controllState.canListening && !controllState.reader) {
      await startListening();
    }
  }, [controllState, counter, startListening]);

  useEffect(() => {
    controllState.canListening = true;
    updateState();
    const interval = setInterval(updateState, 1000);

    return () => {
      clearInterval(interval);
      controllState.canListening = false;
      controllState.reader?.cancel();
      controllState.reader = null;
    };
  }, [controllState, updateState]);

  const update = useCallback((reinit = false) => {
    setCounter(counter + 1);
    if (reinit) {
      setInited(false);
    }
  }, [counter]);

  return {
    loading,
    inited,
    update,
  }
}

export const useMetaState = (url: string | undefined | null, body: any, defaultValue: any, deps: DependencyList = []) => {
  const [state, setState] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [inited, setInited] = useState(false);

  const load = useCallback(async () => {
    if (!url) return;

    try {
      setLoading(true);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/event-stream",
        },
        body: JSON.stringify(body ?? {}),
      });

      setState(await response.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setInited(true);
    }
  }, [url, ...deps]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    loading,
    inited,
    state,
    load,
    setState,
  }
}

export const useVideoMetaState = (key: string | undefined) => {
  const serverState = useMetaState(key ? `/api/video/state/meta?path=${key}` : null, {}, {});

  return {
    ...serverState,
  };
}

export const useVideoState = (body?: any) => {
  const [state, setState] = useState<State>({});
  const serverState = useServerState("/api/video/state/get", body, value => {
    setState(JSON.parse(value));
  });

  const apply = async (state: State) => {
    const response = await fetch("/api/video/state/set", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
    });
    const value = await response.json();
    setState(value);
  };

  const next = async (data: any) => {
    const response = await fetch("/api/video/state/next", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const value = await response.json();
    setState(value);
  };

  return {
    state,
    setState,
    apply,
    next,
    ...serverState,
  };
}

export const usePlaylistState = (body?: PlaylistState) => {
  const [state, setState] = useState<PlaylistState>({});
  const serverState = useServerState("/api/playlist/state/get", body, value => {
    setState(JSON.parse(value));
  });

  const apply = async (state: PlaylistState) => {
    const response = await fetch("/api/playlist/state/set", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
    });
    const value = await response.json();
    setState(value);
  };

  return {
    state,
    setState,
    apply,
    ...serverState,
  };
}

export const useTorrentState = (body?: any) => {
  const [state, setState] = useState<TorrentState>({});
  const serverState = useServerState("/api/torrent/state/get", body, value => {
    setState(JSON.parse(value));
  },);

  const apply = async (state: State) => {
    const response = await fetch("/api/video/state/set", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
    });
    const value = await response.json();
    setState(value);
  };

  return {
    state,
    setState,
    apply,
    ...serverState,
  };
}

