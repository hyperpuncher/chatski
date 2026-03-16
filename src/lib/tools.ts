import { shell } from "$lib/remote/shell.remote";
import { readSkill } from "$lib/remote/skills.remote";
import { scrape, search } from "$lib/remote/web.remote";
import { tool } from "ai";
import * as z from "zod/v4";

export const fetchTool = tool({
	description: "Fetch and read content from a URL",
	inputSchema: z.object({
		url: z.string(),
	}),
	execute: async ({ url }) => {
		const text = await scrape(url);
		return text;
	},
});

export const searchTool = tool({
	description: "Brave search",
	inputSchema: z.object({
		query: z.string(),
	}),
	execute: async ({ query }) => {
		const text = await search(query);
		return text;
	},
});

export const shellTool = tool({
	description: "Execute a bash command",
	inputSchema: z.object({
		command: z.string(),
	}),
	execute: async ({ command }) => {
		const output = await shell({ command });
		return output;
	},
});

export const readSkillTool = tool({
	description: "Read a skill",
	inputSchema: z.object({
		path: z.string(),
	}),
	execute: async ({ path }) => {
		const text = await readSkill({ path });
		return text;
	},
});
