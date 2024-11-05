import { bot } from "../api/telegram.js";
import {
	helpHandler,
	poolsHandler,
	subscribeHandler,
	unsubscribeHandler
} from "./commandHandlers.js";

export async function startBot() {
	bot.command("pools", poolsHandler);
	bot.command("subscribe", subscribeHandler);
	bot.command("unsubscribe", unsubscribeHandler);
	bot.command("help", helpHandler);

	try {
		await bot.launch();
		console.log("Bot started successfully!");
	} catch (error) {
		console.error("Error starting bot:", error);
	}
}
