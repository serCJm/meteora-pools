import { Telegraf } from "telegraf";
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
	console.error("Error: BOT_TOKEN environment variable not set.");
	process.exit(1);
}

export const bot = new Telegraf(BOT_TOKEN);
