import { command, query } from "$app/server";
import { redis } from "bun";
import * as v from "valibot";

import { requireAuth } from "./auth.remote";

export const getChats = query(async () => {
	const user = await requireAuth();
	const keys = await redis.keys(`chats:${user.userId}:*`);
	return keys
		.map((key) => key.split(":").at(-1))
		.filter((id) => id !== undefined)
		.sort()
		.reverse();
});

export const getTitle = query.batch(v.string(), async (ids) => {
	await requireAuth();
	const keys = ids.map((id) => `chat:title:${id}`);
	const titles = await redis.mget(...keys);
	const lookup = new Map(ids.map((id, i) => [id, titles[i]]));
	return (id) => lookup.get(id);
});

export const getMessages = query(v.string(), async (chatId) => {
	const user = await requireAuth();
	const chat = await redis.get(`chats:${user.userId}:${chatId}`);
	if (chat) {
		return JSON.parse(chat);
	}
	return;
});

export const saveChat = command("unchecked", async ({ chatId, messages }) => {
	const user = await requireAuth();

	const text = messages
		.at(0)
		?.parts.find((p: any) => p.type === "text")
		?.text.slice(0, 60)
		.trim();

	const filePart = messages.at(0)?.parts.find((p: any) => p.type === "file");

	let title: string;
	if (text) {
		title = text;
	} else if (filePart?.mediaType) {
		if (filePart.mediaType.startsWith("image/")) title = "image";
		else if (filePart.mediaType.startsWith("audio/")) title = "audio";
		else if (filePart.mediaType.startsWith("video/")) title = "video";
		else if (filePart.mediaType === "application/pdf") title = "pdf";
		else title = "file";
	} else if (filePart) {
		title = "file";
	} else {
		title = "new chat";
	}

	await Promise.all([
		redis.set(`chats:${user.userId}:${chatId}`, JSON.stringify(messages)),
		redis.setnx(`chat:title:${chatId}`, title),
	]);
	getChats().refresh();
});

export const deleteChat = command(v.string(), async (chatId) => {
	const user = await requireAuth();
	await Promise.all([
		redis.del(`chats:${user.userId}:${chatId}`),
		redis.del(`chat:title:${chatId}`),
	]);
	getChats().refresh();
});

export const deleteAllChats = command(async () => {
	const user = await requireAuth();
	const keys = await redis.keys(`chats:${user.userId}:*`);
	await redis.del(...keys);
	getChats().refresh();
});
