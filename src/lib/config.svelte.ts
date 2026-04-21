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
	model: "moonshotai/kimi-k2.6",
	favorites: ["minimax/minimax-m2.7", "moonshotai/kimi-k2.6", "xiaomi/mimo-v2-omni"],
	labs: [
		"anthropic",
		"deepseek",
		"google",
		"minimax",
		"moonshotai",
		"openai",
		"openrouter",
		"x-ai",
		"xiaomi",
		"z-ai",
	],
	reasoning: "minimal",
	sidebarSide: "right",
	stats: true,
	mcps: [],
	showToolOutput: true,
	showReasoning: true,
	ignoredProviders: [
		"alibaba",
		"anthropic",
		"atlas-cloud",
		"baseten",
		"cerebras",
		"chutes",
		"clarifai",
		"deepinfra",
		"deepseek",
		"friendli",
		"hyperbolic",
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
	enabledTools: ["fetch", "search", "shell", "skill"],
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
