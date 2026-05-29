import { configStorage } from "./storage";

export type ToolName = "fetch" | "search" | "shell" | "skill";

type Settings = {
	apiKey: string;
	proxyUrl: string;
	model: string;
	favorites: string[];
	labs: string[];
	reasoning: "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
	sidebarSide: "left" | "right";
	stats: boolean;
	mcps: MCP[];
	showToolOutput: boolean;
	showReasoning: boolean;
	ignoredProviders: string[];
	preferredProviders: string[];
	enabledTools: ToolName[];
};

export type MCP = {
	type: "http" | "stdio";
	name: string;
	url: string;
	command: string;
	args: string;
	enabled: boolean;
};

const defaultSettings: Settings = {
	apiKey: "",
	proxyUrl: "",
	model: "xiaomi/mimo-v2.5",
	favorites: ["deepseek/deepseek-v4-flash", "xiaomi/mimo-v2.5"],
	labs: [
		"anthropic",
		"deepseek",
		"google",
		"minimax",
		"moonshotai",
		"nvidia",
		"openai",
		"openrouter",
		"qwen",
		"stepfun",
		"x-ai",
		"xiaomi",
		"z-ai",
	],
	reasoning: "none",
	sidebarSide: "right",
	stats: true,
	mcps: [],
	showToolOutput: false,
	showReasoning: false,
	ignoredProviders: [
		"akashml",
		"atlas-cloud",
		"baidu",
		"baseten",
		"cerebras",
		"chutes",
		"clarifai",
		"cloudflare",
		"deepinfra",
		"friendli",
		"gmicloud",
		"inceptron",
		"io-net",
		"mancer",
		"modelrun",
		"nebius",
		"nextbit",
		"novita",
		"parasail",
		"phala",
		"sambanova",
		"siliconflow",
		"together",
		"venice",
	],
	preferredProviders: ["google-ai-studio", "groq"],
	enabledTools: ["fetch", "search", "skill"],
};

class ConfigStore {
	settings = $state<Settings>(defaultSettings);
	isInitialized = $state(false);

	init = async () => {
		const saved = await configStorage.get<Partial<Settings>>("config");
		if (saved) {
			this.settings = { ...defaultSettings, ...saved };
		}
		this.isInitialized = true;
	};

	save = async () => {
		await configStorage.set("config", this.settings);
	};

	clear = async () => {
		this.settings = defaultSettings;
		await configStorage.del("config");
	};
}

export const config = new ConfigStore();
