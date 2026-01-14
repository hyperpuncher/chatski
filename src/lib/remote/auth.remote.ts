import { error } from "@sveltejs/kit";
import { getRequestEvent, query } from "$app/server";

export const requireAuth = query(async () => {
	const { session } = getRequestEvent().locals;
	if (!session) {
		error(401, "Unauthorized");
	}
	return session.user;
});
