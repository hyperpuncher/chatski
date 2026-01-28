import { localStorage } from "./storage";

type Settings = {
	apiKey: string;
	defaultModel: string;
	selectedModel: string;
	favorites: string[];
	labs: string[];
	reasoning: "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
	sidebarSide: "left" | "right";
	stats: boolean;
	mcps: MCP[];
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
	defaultModel: "moonshotai/kimi-k2.5",
	selectedModel: "moonshotai/kimi-k2.5",
	favorites: ["moonshotai/kimi-k2.5"],
	labs: [
		"anthropic",
		"deepseek",
		"google",
		"minimax",
		"moonshotai",
		"openai",
		"x-ai",
		"xiaomi",
		"z-ai",
	],
	reasoning: "none",
	sidebarSide: "right",
	stats: false,
	mcps: [],
};

class ConfigStore {
	settings = $state<Settings>(defaultSettings);
	isInitialized = $state(false);

	init = async () => {
		const saved = await localStorage.get<Partial<Settings>>("config");
		if (!saved) return;
		this.settings = {
			...defaultSettings,
			...saved,
		};
		this.isInitialized = true;
	};

	save = async () => {
		await localStorage.set("config", this.settings);
		this.isInitialized = true;
	};

	clear = async () => {
		this.settings = defaultSettings;
		await localStorage.remove("config");
		this.isInitialized = false;
	};
}

export const config = new ConfigStore();
