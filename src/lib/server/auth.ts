import { getRequestEvent } from "$app/server";
import { env } from "$env/dynamic/private";
import { betterAuth } from "better-auth/minimal";
import { sveltekitCookies } from "better-auth/svelte-kit";

export const auth = betterAuth({
	user: {
		additionalFields: {
			userId: { type: "number" },
		},
	},
	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
			scope: ["read:user", " user:email"],

			getUserInfo: async ({ accessToken }) => {
				const headers = {
					Authorization: `Bearer ${accessToken}`,
					Accept: "application/vnd.github+json",
				};

				const [profileRes, emailsRes] = await Promise.all([
					fetch("https://api.github.com/user", { headers }),
					fetch("https://api.github.com/user/emails", { headers }),
				]);

				const profile = await profileRes.json();
				const emails = await emailsRes.json();

				const email = emails.find((e: any) => e.primary && e.verified)?.email;

				return {
					user: {
						id: profile.id,
						name: profile.name ?? profile.login,
						email: email ?? null,
						emailVerified: !!email,
						image: profile.avatar_url,
						userId: profile.id,
					},
					data: { profile, emails },
				};
			},
		},
	},
	plugins: [sveltekitCookies(getRequestEvent)],
});

export type Session = typeof auth.$Infer.Session;
