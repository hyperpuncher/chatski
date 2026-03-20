import { config } from "$lib/config.svelte";
import { tool } from "ai";
import * as z from "zod/v4";

export const fetchTool = tool({
	description: "Fetch and read content from a URL",
	inputSchema: z.object({
		url: z.string(),
	}),
	execute: async ({ url }) => {
		return await window.api.scrape({
			url,
			proxyUrl: config.settings.proxyUrl || undefined,
		});
	},
});

export const searchTool = tool({
	description: "Brave search",
	inputSchema: z.object({
		query: z.string(),
	}),
	execute: async ({ query }) => {
		return await window.api.search({
			query,
			proxyUrl: config.settings.proxyUrl || undefined,
		});
	},
});

export const shellTool = tool({
	description: "Execute a bash command",
	inputSchema: z.object({
		command: z.string(),
	}),
	execute: async ({ command }) => {
		return await window.api.shell(command);
	},
});

export const readSkillTool = tool({
	description: "Read a skill",
	inputSchema: z.object({
		path: z.string(),
	}),
	execute: async ({ path }) => {
		return await window.api.skills.read({ path });
	},
});
