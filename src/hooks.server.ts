import { error, type Handle, redirect } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { env } from "$env/dynamic/private";
import { auth } from "$lib/server/auth";

const AUTH_ALLOWED_EMAILS = env.AUTH_ALLOWED_EMAILS.split(",");

const authHandler: Handle = async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth, building });
};

const sessionHandler: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers,
	});

	if (session) {
		if (!AUTH_ALLOWED_EMAILS.includes(session.user.email)) {
			error(403, "Forbidden");
		}
		event.locals.session = session.session;
		event.locals.user = session.user;
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
