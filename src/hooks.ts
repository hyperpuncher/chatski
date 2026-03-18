import type { Reroute } from "@sveltejs/kit";

export const reroute: Reroute = ({ url }) => {
	if (url.protocol === "file:" && url.pathname.endsWith("/index.html")) {
		return "/";
	}
};
