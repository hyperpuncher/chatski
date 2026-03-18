import { chat } from "$lib/chat.svelte";
import { config } from "$lib/config.svelte";
import { refreshChats } from "$lib/storage.svelte";

export const ssr = false;
export const prerender = true;

Promise.all([config.init(), chat.newChat(), refreshChats()]);
