import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
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
