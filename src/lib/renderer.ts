import { Marked } from "marked";
import markedShiki from "marked-shiki";
import { createHighlighterCore, createJavaScriptRegexEngine } from "shiki";

let marked: Marked;

export async function getRenderer() {
	if (marked) return marked;
	const highlighter = await createHighlighterCore({
		themes: [import("@shikijs/themes/dracula")],
		langs: [
			import("@shikijs/langs/astro"),
			import("@shikijs/langs/bash"),
			import("@shikijs/langs/c"),
			import("@shikijs/langs/cpp"),
			import("@shikijs/langs/css"),
			import("@shikijs/langs/dockerfile"),
			import("@shikijs/langs/go"),
			import("@shikijs/langs/html"),
			import("@shikijs/langs/http"),
			import("@shikijs/langs/ini"),
			import("@shikijs/langs/javascript"),
			import("@shikijs/langs/json"),
			import("@shikijs/langs/jsx"),
			import("@shikijs/langs/lua"),
			import("@shikijs/langs/make"),
			import("@shikijs/langs/markdown"),
			import("@shikijs/langs/python"),
			import("@shikijs/langs/regex"),
			import("@shikijs/langs/rust"),
			import("@shikijs/langs/sql"),
			import("@shikijs/langs/svelte"),
			import("@shikijs/langs/swift"),
			import("@shikijs/langs/templ"),
			import("@shikijs/langs/toml"),
			import("@shikijs/langs/tsx"),
			import("@shikijs/langs/typescript"),
			import("@shikijs/langs/typst"),
			import("@shikijs/langs/vue"),
			import("@shikijs/langs/yaml"),
		],
		engine: createJavaScriptRegexEngine(),
	});

	marked = new Marked().use(
		markedShiki({
			highlight(code, lang, props) {
				return highlighter.codeToHtml(code, { lang, theme: "dracula", ...props });
			},
		}),
	);

	return marked;
}
