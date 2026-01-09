import { redis } from "bun";
import { query } from "$app/server";
import { OPENROUTER_KEY } from "$env/static/private";

export const getModels = query(async () => {
	const cached = await redis.get("openrouter:models");
	if (cached) {
		return parseModels(JSON.parse(cached));
	}

	const res = await fetch("https://openrouter.ai/api/v1/models", {
		headers: { Authorization: `Bearer ${OPENROUTER_KEY}` },
	});

	const json = await res.json();

	redis.setex(
		"openrouter:models",
		60 * 60 * 24, // 1 day
		JSON.stringify(json),
	);

	return parseModels(json);
});

function parseModels(models: any): string[] {
	return models.data.map((model: any) => model.id).sort();
}
