import { redis } from "bun";
import { query } from "$app/server";
import { env } from "$env/dynamic/private";

const labs = new Set([
	"anthropic",
	"deepseek",
	"google",
	"minimax",
	"moonshotai",
	"openai",
	"x-ai",
	"xiaomi",
	"z-ai",
]);

export const getModels = query(async () => {
	const cached = await redis.get("openrouter:models");
	if (cached) {
		return parseModels(JSON.parse(cached));
	}

	const res = await fetch("https://openrouter.ai/api/v1/models", {
		headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
	});

	const json = await res.json();

	redis.setex(
		"openrouter:models",
		60 * 60 * 24, // 1 day
		JSON.stringify(json.data),
	);

	return parseModels(json.data);
});

function parseModels(models: string[]) {
	return models
		.filter((model: any) => labs.has(model.id.split("/")[0]))
		.map((model: any) => ({
			id: model.id,
			name: model.name,
			modalities: {
				input: model.architecture.input_modalities,
				output: model.architecture.output_modalities,
			},
			supportedParameters: model.supported_parameters,
		}))
		.sort((a, b) => a.id.localeCompare(b.id));
}
