import { contextBridge, ipcRenderer } from "electron";

export type ReadSkillInput = {
	path: string;
};

export type ScrapeInput = {
	url: string;
	proxyUrl?: string;
};

export type SearchInput = {
	query: string;
	proxyUrl?: string;
};

export type ShellInput = string;

const api = {
	getSkills: (): Promise<string> => ipcRenderer.invoke("getSkills"),
	readSkill: (input: ReadSkillInput): Promise<string> =>
		ipcRenderer.invoke("readSkill", input),
	scrape: (input: ScrapeInput): Promise<string> => ipcRenderer.invoke("scrape", input),
	search: (input: SearchInput): Promise<string> => ipcRenderer.invoke("search", input),
	shell: (cmd: ShellInput): Promise<string> => ipcRenderer.invoke("shell", cmd),

	// Config storage — raw JSON string over IPC to avoid double serialization
	config: {
		get: (): Promise<string | null> => ipcRenderer.invoke("config:get"),
		set: (json: string): Promise<void> => ipcRenderer.invoke("config:set", json),
		clear: (): Promise<void> => ipcRenderer.invoke("config:clear"),
	},

	// Session storage — JSONL format (one message per line)
	sessions: {
		list: (): Promise<string[]> => ipcRenderer.invoke("sessions:list"),
		titles: (): Promise<Array<{ id: string; title: string }>> =>
			ipcRenderer.invoke("sessions:titles"),
		load: (chatId: string): Promise<string | null> =>
			ipcRenderer.invoke("sessions:load", chatId),
		save: (chatId: string, jsonl: string): Promise<void> =>
			ipcRenderer.invoke("sessions:save", chatId, jsonl),
		delete: (chatId: string): Promise<void> =>
			ipcRenderer.invoke("sessions:delete", chatId),
		clear: (): Promise<void> => ipcRenderer.invoke("sessions:clear"),
	},

	// Cache storage (OpenRouter models, etc.)
	cache: {
		get: (key: string): Promise<string | null> =>
			ipcRenderer.invoke("cache:get", key),
		set: (key: string, data: string): Promise<void> =>
			ipcRenderer.invoke("cache:set", key, data),
		del: (key: string): Promise<void> => ipcRenderer.invoke("cache:del", key),
	},
};

contextBridge.exposeInMainWorld("api", api);

export type API = typeof api;
