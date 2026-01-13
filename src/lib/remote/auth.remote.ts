import { error } from "@sveltejs/kit";
import { getRequestEvent, query } from "$app/server";

export const requireAuth = query(async () => {
	const { user } = getRequestEvent().locals;
	if (!user) {
		error(401, "Unauthorized");
	}
	return user;
});
