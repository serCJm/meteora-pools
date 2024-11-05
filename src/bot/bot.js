import { Telegraf } from "telegraf";
import {
	helpHandler,
	poolsHandler,
	subscribeHandler,
	unsubscribeHandler
} from "./commandHandlers.js";

/**
 * @param {string} token - Telegram Bot API token.
 */
export function startBot(token) {
	const bot = new Telegraf(token);

	bot.command("pools", poolsHandler);
	bot.command("subscribe", subscribeHandler);
	bot.command("unsubscribe", unsubscribeHandler);
	bot.command("help", helpHandler);

	bot.launch();
}
