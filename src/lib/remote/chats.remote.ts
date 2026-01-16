import { redis } from "bun";
import * as v from "valibot";
import { command, query } from "$app/server";
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
	await redis.set(`chats:${user.userId}:${chatId}`, JSON.stringify(messages));
	await redis.set(
		`chat:title:${chatId}`,
		messages.at(0)?.parts.at(-1)?.text.slice(0, 22).trim(),
	);
	getChats().refresh();
});

export const deleteChat = command(v.string(), async (chatId) => {
	const user = await requireAuth();
	await redis.del(`chats:${user.userId}:${chatId}`);
	getChats().refresh();
});

export const deleteAllChats = command(async () => {
	const user = await requireAuth();
	const keys = await redis.keys(`chats:${user.userId}:*`);
	await redis.del(...keys);
	getChats().refresh();
});
