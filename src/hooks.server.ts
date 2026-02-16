import { building } from "$app/environment";
import { env } from "$env/dynamic/private";
import { auth } from "$lib/server/auth";
import { error, type Handle, redirect } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";

const authHandler: Handle = async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth, building });
};

const sessionHandler: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers,
	});

	if (session) {
		const emails = env.AUTH_ALLOWED_EMAILS.split(",").map((e) => e.trim());
		if (!emails.includes(session.user.email)) {
			error(403, "Forbidden");
		}
		event.locals.session = session;
	}

	if (event.url.pathname !== "/login" && !session) {
		redirect(303, "/login");
	}

	return resolve(event);
};

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

export const handle = sequence(authHandler, sessionHandler, headersHandler);
