import { startBot } from "./src/bot.js";

/**
 * Starts the Telegram bot.
 */
function start() {
	const token = process.env.BOT_TOKEN;
	if (!token) {
		console.error("Error: BOT_TOKEN environment variable not set.");
		return;
	}
	startBot(token);
}

start();
