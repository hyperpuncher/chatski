import { localStorage } from "./storage";

class Config {
	apiKey = $state<string | null>(null);
	isConfigured = $derived(!!this.apiKey);

	init = async () => {
		this.apiKey = await localStorage.get<string>("apiKey");
	};

	save = async (key: string) => {
		this.apiKey = key;
		await localStorage.set("apiKey", this.apiKey);
	};

	clear = async () => {
		this.apiKey = "";
		await localStorage.remove("apiKey");
	};
}

export const config = new Config();
