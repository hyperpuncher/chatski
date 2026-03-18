import type { ScrollState } from "runed";
import { createContext } from "svelte";

export const [getScrollContext, setScrollContext] = createContext<ScrollState>();
