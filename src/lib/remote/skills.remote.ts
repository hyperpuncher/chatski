import { homedir } from "node:os";
import { join } from "node:path";

import { query } from "$app/server";
import { Glob } from "bun";
import matter from "gray-matter";
import * as z from "zod/v4";

const HOME = homedir();
const SKILLS = join(HOME, ".agents", "skills");
const glob = new Glob("**/SKILL.md");

type Skill = {
	name: string;
	description: string;
	path: string;
};

export const getSkills = query(async () => {
	const skills: Skill[] = [];

	for await (const file of glob.scan({ cwd: SKILLS, absolute: true })) {
		const raw = await Bun.file(file).text();
		const { data } = matter(raw);
		skills.push({
			name: data.name,
			description: data.description,
			path: file,
		});
	}

	return formatSkills(skills);
});

export const readSkill = query(z.object({ path: z.string() }), async ({ path }) => {
	const raw = await Bun.file(path).text();
	const { content } = matter(raw);
	return content;
});

function formatSkills(skills: Skill[]) {
	const lines = [
		"The following skills provide specialized instructions for specific tasks.",
		"Use the skill tool to load a skill's file when the task matches its description.",
		"When a skill file references a relative path, resolve it against the skill directory (parent of SKILL.md / dirname of the path) and use that absolute path in tool commands.",
		"",
		"<available_skills>",
	];

	for (const skill of skills) {
		lines.push("  <skill>");
		lines.push(`    <name>${skill.name}</name>`);
		lines.push(`    <description>${skill.description}</description>`);
		lines.push(`    <location>${skill.path}</location>`);
		lines.push("  </skill>");
	}

	lines.push("</available_skills>");

	return lines.join("\n");
}
