import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: "autoUpdate",
			manifest: {
				name: "chatski",
				short_name: "chatski",
				description: "chatski with your slop generators",
				icons: [
					{
						src: "/favicon.svg",
						sizes: "any",
						type: "image/svg+xml",
					},
				],
			},
		}),
		devtoolsJson(),
		visualizer({
			filename: "stats.html",
			emitFile: true,
			brotliSize: true,
			template: "treemap",
		}),
	],
	server: {
		watch: {
			usePolling: true,
		},
	},
});
