import { useCallback, useEffect, useMemo, useState } from "react";
import { State } from "../state";

export const useVideoState = (fn?: (data: string) => void | Promise<void>) => {
  const [state, setState] = useState<State>({});
  const controllState = useMemo<{
    canListening: boolean;
    isListening: boolean;
    reader: ReadableStreamDefaultReader<string> | null
  }>(() => ({
    canListening: true,
    isListening: false,
    reader: null,
  }), []);

  const startListening = useCallback(async () => {
    controllState.isListening = true;

    try {
      const response = await fetch("/api/video/state", {
        method: "POST",
        headers: {
          "Content-Type": "text/event-stream",
        },
        body: JSON.stringify({}),
      });
    
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
          setState(JSON.parse(value));
          fn?.(value);
        }
      }
    } catch (error) {
      console.error(error);
    }

    controllState.reader = null;
    controllState.isListening = false;
  }, []);

  const updateState = async () => {
    if (!controllState.isListening && controllState.canListening && !controllState.reader) {
      await startListening();
    }
  };

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
  }, []);

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
    apply,
  };
}
