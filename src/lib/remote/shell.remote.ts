import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { query } from "$app/server";
import { $ } from "bun";
import * as z from "zod/v4";

const HOME = homedir();
const PLAYGROUND = join(HOME, "Desktop", "playground");
await mkdir(PLAYGROUND, { recursive: true });
$.cwd(PLAYGROUND);

export const shell = query(z.object({ command: z.string() }), async ({ command }) => {
	try {
		return await $`${{ raw: command }}`.text();
	} catch (err) {
		console.error(err);
		if (err instanceof $.ShellError) {
			return err.stderr.toString();
		}
		throw err;
	}
});
