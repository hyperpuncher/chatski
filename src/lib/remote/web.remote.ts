import { query } from "$app/server";
import { env } from "$env/dynamic/private";
import { Impit } from "impit";
import TurndownService from "turndown";
import * as z from "zod/v4";

const turndownService = new TurndownService();
turndownService.remove([
	"aside",
	"footer",
	"form",
	"header",
	"iframe",
	"nav",
	"noscript",
	"script",
	"style",
]);

const scrapeSchema = z.object({
	url: z.string(),
	proxyUrl: z.string().optional(),
});

export const scrape = query(scrapeSchema, async ({ url, proxyUrl }) => {
	const impit = getClient(proxyUrl);
	const res = await impit.fetch(url);
	let html = await res.text();
	const text = turndownService.turndown(html);
	return text;
});

const searchSchema = z.object({
	query: z.string(),
	proxyUrl: z.string().optional(),
});

export const search = query(searchSchema, async ({ query, proxyUrl }) => {
	const impit = getClient(proxyUrl);
	const res = await impit.fetch(
		`https://search.brave.com/search?q=${encodeURIComponent(query)}`,
	);

	if (!res.ok) {
		throw new Error(`Failed to fetch search results: ${res.statusText}`);
	}

	const html = await res.text();
	let text = turndownService.turndown(html);

	text = text
		.replace(/!?\[.*?imgs\.search\.brave\.com.*/g, "")
		.replace(/.*›.*/g, "")
		.replace(/\[\n+/g, "")
		.replace(/\n+\]/g, "")
		.replace(/\n{3,}/g, "\n\n");

	return text;
});

function getClient(proxyUrl?: string) {
	return new Impit({
		browser: "chrome",
		proxyUrl: proxyUrl || env.PROXY_URL,
		ignoreTlsErrors: true,
	});
}
