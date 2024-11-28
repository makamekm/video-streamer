import { DependencyList, useCallback, useEffect, useMemo, useState } from "react";
import { PlaylistState, State, TorrentState } from "../state";

export const useServerState = (url: string, active: boolean, body: any, fn: (data: string) => void | Promise<void>, deps: DependencyList = []) => {
  const [loading, setLoading] = useState(() => active);
  const [inited, setInited] = useState(() => false);
  const [counter, setCounter] = useState(() => 0);

  const controllState = useMemo<{
    isListening: boolean;
    reader: ReadableStreamDefaultReader<string> | null
    response: Response | null;
    abortController: AbortController | null,
  }>(() => ({
    isListening: false,
    reader: null,
    response: null,
    abortController: null,
  }), [body, counter]);

  const startListening = useCallback(async () => {
    controllState.isListening = true;

    try {
      setLoading(true);

      controllState.abortController = new AbortController();
      const signal = controllState.abortController.signal;

      controllState.response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/event-stream",
        },
        body: JSON.stringify(body ?? {}),
        signal,
      });

      setLoading(false);
      setInited(true);

      if (!controllState.response.body) return;

      const reader = controllState.response
        .body
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
            const values = value.split('\n');
            for (const value of values) {
              fn?.(value);
            }
          } catch (error) {
            //
          }
        }
      }

      controllState.response = null;
      controllState.abortController = null;
    } catch (error) {
      setLoading(false);
      setInited(true);

      console.error(error);
    }

    controllState.reader = null;
    controllState.isListening = false;
  }, [controllState, url, ...deps]);

  const updateState = useCallback(async () => {
    if (active) {
      if (!controllState.isListening && !controllState.reader) {
        await startListening();
      }
    } else {
      controllState.abortController?.abort();
      controllState.abortController = null;
      controllState.reader?.cancel();
      controllState.reader = null;
    }
  }, [controllState, counter, startListening, active]);

  useEffect(() => {
    updateState();
    const interval = setInterval(updateState, 1000);

    return () => {
      clearInterval(interval);
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
  const serverState = useServerState("/api/video/state/get", true, body, value => {
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

export const useStreamState = (body?: any) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [active, setActive] = useState<boolean>(false);
  const stream = useServerState("/api/stream", active, body, value => {
    setLogs(logs => [
      ...logs,
      value,
    ])
  });

  const stop = async () => {
    setActive(false);
    setLogs([]);
    await fetch("/api/stream", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
  };

  return {
    ...stream,
    stop,
    active,
    setActive,
    logs,
  };
}

export const useFSState = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [active, setActive] = useState<boolean>(true);
  const stream = useServerState("/api/fs", active, {}, value => {
    setLogs(logs => [
      ...logs,
      value,
    ])
  });

  const stop = async () => {
    setActive(false);
    setLogs([]);
    await fetch("/api/fs", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
  };

  return {
    ...stream,
    stop,
    active,
    setActive,
    logs,
  };
}

export const usePlaylistState = (body?: PlaylistState) => {
  const [state, setState] = useState<PlaylistState>({});
  const serverState = useServerState("/api/playlist/state/get", true, body, value => {
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
  const serverState = useServerState("/api/torrent/state/get", true, body, value => {
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

