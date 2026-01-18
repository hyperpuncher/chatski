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
				theme_color: "#ffffff",
				icons: [
					{
						src: "/pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "/pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any",
					},
					{
						src: "/pwa-maskable-192x192.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "maskable",
					},
					{
						src: "/pwa-maskable-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
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
