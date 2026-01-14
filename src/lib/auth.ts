import { createAuthClient } from "better-auth/svelte";

export const authClient = createAuthClient({});

export const signIn = async () => {
	await authClient.signIn.social({
		provider: "github",
	});
};
