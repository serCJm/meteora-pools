import { startBot } from "./src/bot/bot.js";

/**
 * Starts the Telegram bot.
 */
function start() {
	try {
		const token = process.env.BOT_TOKEN;
		if (!token) {
			console.error("Error: BOT_TOKEN environment variable not set.");
			return;
		}
		startBot(token);
	} catch (error) {
		console.error(error);
	}
}

start();
