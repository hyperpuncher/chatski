import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "electron-vite";
import { visualizer } from "rollup-plugin-visualizer";

const isDev = process.argv.includes("dev");

export default defineConfig({
	main: {
		build: {
			lib: {
				entry: "electron/main.ts",
			},
		},
	},
	preload: {
		build: {
			lib: {
				entry: "electron/preload.ts",
			},
		},
	},
	// Dev-only: SvelteKit handles production build via adapter-static
	...(isDev && {
		renderer: {
			root: "src",
			plugins: [
				tailwindcss(),
				sveltekit(),
				visualizer({
					filename: "stats.html",
					emitFile: true,
					brotliSize: true,
					template: "treemap",
				}),
			],
		},
	}),
});
