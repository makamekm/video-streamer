import { bind } from "@react-rxjs/core"
import { createSignal } from "@react-rxjs/utils"

export const [textChange$, setText] = createSignal<string>();
export const [useText, text$] = bind(textChange$, "");
