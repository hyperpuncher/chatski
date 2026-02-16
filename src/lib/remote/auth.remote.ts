import { getRequestEvent, query } from "$app/server";
import { error } from "@sveltejs/kit";

export const requireAuth = query(async () => {
	const { session } = getRequestEvent().locals;
	if (!session) {
		error(401, "Unauthorized");
	}
	return session.user;
});
