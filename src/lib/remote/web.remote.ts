import { query } from "$app/server";
import { PROXY_URL } from "$env/static/private";
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

export const scrape = query(z.string(), async (url) => {
	const impit = getClient();
	const res = await impit.fetch(url);
	let html = await res.text();
	const text = turndownService.turndown(html);
	return text;
});

export const search = query(z.string(), async (query) => {
	const impit = getClient();
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

function getClient() {
	return new Impit({
		browser: "chrome",
		proxyUrl: PROXY_URL,
		ignoreTlsErrors: true,
	});
}
