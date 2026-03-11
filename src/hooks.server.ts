import type { Handle } from "@sveltejs/kit";

const headersHandler: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	response.headers.set(
		"Strict-Transport-Security",
		"max-age=63072000; includeSubDomains; preload",
	);
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("X-XSS-Protection", "0");
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	return response;
};

export const handle = headersHandler;
