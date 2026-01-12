import { redis } from "bun";
import * as v from "valibot";
import { command, query } from "$app/server";

export const getChats = query(async () => {
	const keys = await redis.keys("chats:*");
	return keys.map((key) => key.split(":")[1]);
});

export const getTitle = query.batch(v.string(), async (ids) => {
	const keys = ids.map((id) => `chat:title:${id}`);
	const titles = await redis.mget(...keys);
	const lookup = new Map(ids.map((id, i) => [id, titles[i]]));
	return (id) => lookup.get(id);
});

export const getMessages = query(v.string(), async (chatId) => {
	const chat = await redis.get(`chats:${chatId}`);
	if (chat) {
		return JSON.parse(chat);
	}
	return;
});

export const saveChat = command("unchecked", async ({ chatId, messages }) => {
	await redis.set(`chats:${chatId}`, JSON.stringify(messages));
	await redis.set(`chat:title:${chatId}`, messages.at(0)?.parts.at(-1)?.text);
	getChats().refresh();
});

export const deleteChat = command(v.string(), async (chatId) => {
	await redis.del(`chats:${chatId}`);
	getChats().refresh();
});

export const deleteAllChats = command(async () => {
	const keys = await redis.keys("chats:*");
	await redis.del(...keys);
	getChats().refresh();
});
