import { bot } from "../api/telegram.js";
import {
	helpHandler,
	poolsHandler,
	subscribeHandler,
	unsubscribeHandler
} from "./commandHandlers.js";

export function startBot() {
	bot.command("pools", poolsHandler);
	bot.command("subscribe", subscribeHandler);
	bot.command("unsubscribe", unsubscribeHandler);
	bot.command("help", helpHandler);

	bot.launch()

		.catch((error) => {
			console.error("Error starting bot:", error);
		});
	console.log("Bot started successfully.");
}
