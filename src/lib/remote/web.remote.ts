import { query } from "$app/server";
import { PROXY_URL } from "$env/static/private";
import { Impit } from "impit";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import * as z from "zod/v4";

const turndownService = new TurndownService();

export const scrape = query(z.object({ url: z.string() }), async ({ url }) => {
	const impit = getClient();
	const res = await impit.fetch(url);

	let html = await res.text();
	html = cleanHtml(html);
	const text = turndownService.turndown(html);

	return text;
});

export const search = query(z.object({ query: z.string() }), async ({ query }) => {
	const impit = getClient();
	const res = await impit.fetch(
		`https://search.brave.com/search?q=${encodeURIComponent(query)}`,
	);

	if (!res.ok) {
		throw new Error(`Failed to fetch search results: ${res.statusText}`);
	}

	let html = await res.text();
	html = cleanHtml(html);

	let text = turndownService.turndown(html);

	text = text
		.replace(/!?\[.*?imgs\.search\.brave\.com.*/g, "")
		.replace(/.*›.*/g, "")
		.replace(/\[\n+/g, "")
		.replace(/\n+\]/g, "")
		.replace(/\n{3,}/g, "\n\n");

	return text;
});

function cleanHtml(html: string): string {
	const dom = new JSDOM(html);
	const doc = dom.window.document;

	const selectors = [
		"script",
		"style",
		"nav",
		"footer",
		"header",
		"aside",
		".ads",
		".sidebar",
		"[role='banner']",
		"[role='navigation']",
		"noscript",
		"iframe",
	];

	for (const selector of selectors) {
		for (const el of doc.querySelectorAll(selector)) {
			el.remove();
		}
	}

	return doc.body?.innerHTML || html;
}

function getClient() {
	return new Impit({
		browser: "chrome",
		proxyUrl: PROXY_URL,
		ignoreTlsErrors: true,
	});
}
