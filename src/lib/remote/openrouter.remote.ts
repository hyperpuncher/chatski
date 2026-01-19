import { redis } from "bun";
import * as v from "valibot";
import { query } from "$app/server";
import { env } from "$env/dynamic/private";

export const getModels = query(v.array(v.string()), async (labs) => {
	const cached = await redis.get("openrouter:data");
	if (cached) {
		return parseModels(JSON.parse(cached), labs);
	}

	const res = await fetch("https://openrouter.ai/api/v1/models", {
		headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
	});

	const json = await res.json();

	redis.setex(
		"openrouter:data",
		60 * 60 * 4, // 4 hours
		JSON.stringify(json.data),
	);

	return parseModels(json.data, labs);
});

export const getLabs = query(async () => {
	const cached = await redis.get("openrouter:data");
	if (cached) {
		return parseLabs(JSON.parse(cached));
	}

	const res = await fetch("https://openrouter.ai/api/v1/models", {
		headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
	});

	const json = await res.json();

	redis.setex(
		"openrouter:data",
		60 * 60 * 4, // 4 hours
		JSON.stringify(json.data),
	);

	return parseLabs(json.data);
});

function parseModels(data: string[], labs: string[]) {
	const labsSet = new Set(labs);

	return data
		.filter((model: any) => labsSet.has(model.id.split("/")[0]))
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

function parseLabs(data: string[]) {
	return new Set(data.map((lab: any) => lab.id.split("/")[0]).sort());
}
