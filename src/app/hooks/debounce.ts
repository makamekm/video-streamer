import { useEffect } from "react";

export const useDebouncedEffect = (effect: () => (void | Promise<void>), deps: unknown[], delay: number) => {
    useEffect(() => {
        const handler = setTimeout(() => effect(), delay);
        return () => clearTimeout(handler);
    }, [...(deps || []), delay]);
}
