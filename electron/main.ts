import { exec, ExecException } from "node:child_process";
import { existsSync } from "node:fs";
import { glob, readFile, writeFile, mkdir, readdir, unlink, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import path from "node:path";
import { env } from "node:process";
import { promisify } from "node:util";

import { Menu, app, BrowserWindow, ipcMain, shell, dialog } from "electron";
import { autoUpdater } from "electron-updater";
import { Impit } from "impit";
import TurndownService from "turndown";

import type { ReadSkillInput, ScrapeInput, SearchInput, ShellInput } from "./preload";

const execAsync = promisify(exec);

const turndownService = new TurndownService();
turndownService.remove([
	"aside",
	"footer",
	"form",
	"header",
	"iframe",
	"nav",
	"noscript",
	"script",
	"style",
]);

const HOME = homedir();
const SKILLS = join(HOME, ".agents", "skills");

// Config, sessions & cache storage paths (resolved after app is ready)
let CONFIG_DIR: string;
let CONFIG_FILE: string;
let SESSIONS_DIR: string;
let CACHE_DIR: string;

type Skill = {
	name: string;
	description: string;
	path: string;
};

type FrontMatter = {
	name?: string;
	description?: string;
};

app.commandLine.appendSwitch("enable-features", "MiddleClickAutoscroll,OverlayScrollbar");

// Hide menu on Windows/Linux, keep default menu on macOS for keyboard shortcuts
if (process.platform !== "darwin") {
	Menu.setApplicationMenu(null);
}

const createWindow = () => {
	const mainWindow = new BrowserWindow({
		width: 1000,
		height: 1400,
		title: "",
		webPreferences: {
			preload: path.join(import.meta.dirname, "../preload/preload.mjs"),
			sandbox: false,
		},
	});

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: "deny" };
	});

	// Right-click context menu
	mainWindow.webContents.on("context-menu", (_, params) => {
		const template: Electron.MenuItemConstructorOptions[] = [];

		if (params.selectionText) {
			template.push({ role: "copy", label: "Copy" }, { type: "separator" });
		}

		if (params.isEditable) {
			template.push(
				{ role: "cut", label: "Cut" },
				{ role: "copy", label: "Copy" },
				{ role: "paste", label: "Paste" },
				{ type: "separator" },
				{ role: "selectAll", label: "Select All" },
			);
		}

		// Allow inspect element in development
		if (process.env.NODE_ENV === "development") {
			if (template.length > 0) {
				template.push({ type: "separator" });
			}
			template.push({
				label: "Inspect Element",
				click: () => mainWindow.webContents.inspectElement(params.x, params.y),
			});
		}

		if (template.length > 0) {
			const menu = Menu.buildFromTemplate(template);
			menu.popup({ window: mainWindow, x: params.x, y: params.y });
		}
	});

	if (process.env.NODE_ENV === "development" && process.env["ELECTRON_RENDERER_URL"]) {
		mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadFile(path.join(import.meta.dirname, `../renderer/index.html`));
	}
};

app.on("ready", async () => {
	// Resolve storage paths using OS-standard locations
	CONFIG_DIR = app.getPath("userData");
	CONFIG_FILE = join(CONFIG_DIR, "config.json");
	SESSIONS_DIR = join(CONFIG_DIR, "sessions");
	CACHE_DIR = join(app.getPath("temp"), "chatski");
	await mkdir(SESSIONS_DIR, { recursive: true });
	await mkdir(CACHE_DIR, { recursive: true });

	createWindow();

	// Auto-updater setup
	if (!app.isPackaged) {
		// Don't check for updates in development
		return;
	}

	autoUpdater.logger = {
		info: (...args: unknown[]) => console.log("[updater]", ...args),
		error: (...args: unknown[]) => console.error("[updater]", ...args),
		warn: (...args: unknown[]) => console.warn("[updater]", ...args),
		debug: (...args: unknown[]) => console.debug("[updater]", ...args),
	};

	autoUpdater.on("update-available", () => {
		console.log("Update available");
	});

	autoUpdater.on("update-downloaded", (info) => {
		console.log("Update downloaded:", info.version);
		dialog
			.showMessageBox({
				type: "info",
				title: "Update Ready",
				message: `Version ${info.version} has been downloaded. Restart to apply the update?`,
				buttons: ["Restart", "Later"],
			})
			.then((result) => {
				if (result.response === 0) {
					autoUpdater.quitAndInstall();
				}
			});
	});

	autoUpdater.checkForUpdatesAndNotify();
});

app.on("window-all-closed", () => {
	app.quit();
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

ipcMain.handle("version", async (): Promise<string> => {
	return app.getVersion();
});

ipcMain.handle("system", async (): Promise<string> => {
	let systemInfo = `OS: ${process.platform} ${process.arch}\nTime: ${new Date().toLocaleString("sv-SE")}`;

	// Read AGENTS.md from config directory if it exists
	const agentsMdPath = join(CONFIG_DIR, "AGENTS.md");
	if (existsSync(agentsMdPath)) {
		const agentsMd = await readFile(agentsMdPath, "utf-8");
		systemInfo += `\n\n${agentsMd}`;
	}

	return systemInfo;
});

ipcMain.handle("skills:get", async (): Promise<string> => {
	const skills: Skill[] = [];

	for await (const relativePath of glob("**/SKILL.md", { cwd: SKILLS })) {
		const file = join(SKILLS, relativePath);
		const raw = await readFile(file, "utf8");
		const { data } = parseFrontMatter(raw);
		skills.push({
			name: data.name || "",
			description: data.description || "",
			path: file,
		});
	}

	return formatSkills(skills);
});

ipcMain.handle("skills:read", async (_event, input: ReadSkillInput): Promise<string> => {
	const raw = await readFile(input.path, "utf8");
	const { content } = parseFrontMatter(raw);
	return content;
});

ipcMain.handle("scrape", async (_event, input: ScrapeInput): Promise<string> => {
	const impit = getClient(input.proxyUrl);
	const res = await impit.fetch(input.url);
	const html = await res.text();
	return turndownService.turndown(html);
});

ipcMain.handle("search", async (_event, input: SearchInput): Promise<string> => {
	const impit = getClient(input.proxyUrl);
	const res = await impit.fetch(
		`https://search.brave.com/search?q=${encodeURIComponent(input.query)}`,
	);

	if (!res.ok) {
		throw new Error(`Failed to fetch search results: ${res.statusText}`);
	}

	const html = await res.text();
	let text = turndownService.turndown(html);

	text = text
		.replace(/!?\[.*?imgs\.search\.brave\.com.*/g, "")
		.replace(/.*›.*/g, "")
		.replace(/\[\n+/g, "")
		.replace(/\n+\]/g, "")
		.replace(/\n{3,}/g, "\n\n");

	return text;
});

ipcMain.handle("shell", async (_event, command: ShellInput) => {
	try {
		const res = await execAsync(command, { cwd: HOME });
		const out = res.stdout.split("\n");

		if (out.length > 100) {
			const file = join(CACHE_DIR, `${crypto.randomUUID()}.txt`);
			await writeFile(file, res.stdout, "utf-8");

			let lines = out.slice(-100).join("\n");
			lines += `\n\nShowing last 100 lines of output, total output: ${file}`;

			return lines;
		}
		return res.stdout;
	} catch (err) {
		const error = err as ExecException;
		return error.stderr;
	}
});

// ── Config storage ──────────────────────────────────────────────

ipcMain.handle("config:get", async (): Promise<string | null> => {
	if (!existsSync(CONFIG_FILE)) return null;
	return readFile(CONFIG_FILE, "utf-8");
});

ipcMain.handle("config:set", async (_event, data: string): Promise<void> => {
	await mkdir(CONFIG_DIR, { recursive: true });
	await writeFile(CONFIG_FILE, data, "utf-8");
});

ipcMain.handle("config:clear", async (): Promise<void> => {
	if (existsSync(CONFIG_FILE)) await unlink(CONFIG_FILE);
});

// ── Cache storage ───────────────────────────────────────────────

ipcMain.handle("cache:get", async (_event, key: string): Promise<string | null> => {
	const file = join(CACHE_DIR, `${key}.json`);
	if (!existsSync(file)) return null;
	return readFile(file, "utf-8");
});

ipcMain.handle("cache:set", async (_event, key: string, data: string): Promise<void> => {
	await mkdir(CACHE_DIR, { recursive: true });
	const file = join(CACHE_DIR, `${key}.json`);
	await writeFile(file, data, "utf-8");
});

ipcMain.handle("cache:del", async (_event, key: string): Promise<void> => {
	const file = join(CACHE_DIR, `${key}.json`);
	if (existsSync(file)) await unlink(file);
});

// ── Session storage (JSONL) ─────────────────────────────────────

ipcMain.handle("sessions:list", async (): Promise<string[]> => {
	if (!existsSync(SESSIONS_DIR)) return [];
	const files = await readdir(SESSIONS_DIR);
	return files
		.filter((f) => f.endsWith(".jsonl"))
		.map((f) => f.replace(".jsonl", ""))
		.sort()
		.reverse();
});

ipcMain.handle(
	"sessions:titles",
	async (): Promise<Array<{ id: string; title: string }>> => {
		if (!existsSync(SESSIONS_DIR)) return [];
		const files = await readdir(SESSIONS_DIR);
		const chatIds = files
			.filter((f) => f.endsWith(".jsonl"))
			.map((f) => f.replace(".jsonl", ""))
			.sort()
			.reverse();

		const results = await Promise.all(
			chatIds.map(async (id) => {
				try {
					const raw = await readFile(
						join(SESSIONS_DIR, `${id}.jsonl`),
						"utf-8",
					);
					const firstLine = raw.split("\n").find((l) => l.trim());
					if (!firstLine) return { id, title: "new chat" };

					const msg = JSON.parse(firstLine);
					const text = msg.parts?.find((p: any) => p.type === "text")?.text;
					if (text) return { id, title: text.slice(0, 60).trim() };

					const filePart = msg.parts?.find((p: any) => p.type === "file");
					if (filePart?.mediaType) {
						if (filePart.mediaType.startsWith("image/"))
							return { id, title: "image" };
						if (filePart.mediaType.startsWith("audio/"))
							return { id, title: "audio" };
						if (filePart.mediaType.startsWith("video/"))
							return { id, title: "video" };
						if (filePart.mediaType === "application/pdf")
							return { id, title: "pdf" };
					}
					return { id, title: filePart ? "file" : "new chat" };
				} catch {
					return { id, title: "new chat" };
				}
			}),
		);

		return results;
	},
);

ipcMain.handle(
	"sessions:load",
	async (_event, chatId: string): Promise<string | null> => {
		const file = join(SESSIONS_DIR, `${chatId}.jsonl`);
		if (!existsSync(file)) return null;
		return readFile(file, "utf-8");
	},
);

ipcMain.handle(
	"sessions:save",
	async (_event, chatId: string, jsonl: string): Promise<void> => {
		await mkdir(SESSIONS_DIR, { recursive: true });
		const file = join(SESSIONS_DIR, `${chatId}.jsonl`);
		await writeFile(file, jsonl, "utf-8");
	},
);

ipcMain.handle("sessions:delete", async (_event, chatId: string): Promise<void> => {
	const file = join(SESSIONS_DIR, `${chatId}.jsonl`);
	if (existsSync(file)) await unlink(file);
});

ipcMain.handle("sessions:clear", async (): Promise<void> => {
	if (existsSync(SESSIONS_DIR)) {
		await rm(SESSIONS_DIR, { recursive: true });
		await mkdir(SESSIONS_DIR, { recursive: true });
	}
});

function getClient(proxyUrl?: string) {
	return new Impit({
		browser: "chrome",
		proxyUrl: proxyUrl || env.PROXY_URL,
		ignoreTlsErrors: true,
	});
}

function parseFrontMatter(raw: string): { data: FrontMatter; content: string } {
	if (!raw.startsWith("---\n")) {
		return { data: {}, content: raw };
	}

	const end = raw.indexOf("\n---\n", 4);
	if (end === -1) {
		return { data: {}, content: raw };
	}

	const header = raw.slice(4, end);
	const content = raw.slice(end + 5);
	const data: FrontMatter = {};

	for (const line of header.split("\n")) {
		const separator = line.indexOf(":");
		if (separator === -1) continue;
		const key = line.slice(0, separator).trim();
		const value = line
			.slice(separator + 1)
			.trim()
			.replace(/^['"]|['"]$/g, "");
		if (key === "name") data.name = value;
		if (key === "description") data.description = value;
	}

	return { data, content };
}

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
