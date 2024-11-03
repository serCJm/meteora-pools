import { Telegraf } from "telegraf";
import { getDLMMPools } from "../api/meteora.js";
import { parseCommand } from "../commandParser.js";
import { filterPools, formatResponse, sortPools } from "../dataHandler.js";
import { HELP_MESSAGE } from "./helpMessage.js";

/**
 * @param {string} token - Telegram Bot API token.
 */
export function startBot(token) {
	const bot = new Telegraf(token);

	bot.command("pools", async (ctx) => {
		if (!isAllowedUser(ctx)) return;
		const command = ctx.message.text.substring(6);
		try {
			const { sortFields, filterCriteria } = parseCommand(command);
			const pools = await getDLMMPools();

			const sortedPools = sortPools(pools, sortFields);
			console.log(sortedPools);
			const filteredPools = filterPools(sortedPools, filterCriteria);

			if (filteredPools.length === 0) {
				ctx.reply("No pools found matching your criteria.");
				return;
			}

			console.log(filteredPools.slice(0, 10));

			const formattedResponse = formatResponse(filteredPools);

			try {
				const responsesToSend = formattedResponse.slice(0, 10);

				const chunkSize = 4;
				for (let i = 0; i < responsesToSend.length; i += chunkSize) {
					const chunk = responsesToSend.slice(i, i + chunkSize);
					const message = chunk.join("\n");
					await ctx.replyWithHTML(message, {
						disable_web_page_preview: true
					});
				}
			} catch (error) {
				console.error("Error sending pool information:", error);
				ctx.reply(
					"An error occurred while sending the pool information. Please try again later."
				);
				return;
			}
		} catch (error) {
			console.error("Error processing pools:", error);
			ctx.reply(`Error: ${error.message}`);
		}
	});

	bot.command("help", (ctx) => {
		if (!isAllowedUser(ctx)) return;
		try {
			ctx.reply(HELP_MESSAGE, { parse_mode: "HTML" });
		} catch (error) {
			ctx.reply(`Error: ${error.message}`);
		}
	});

	bot.launch();
}

function isAllowedUser(ctx) {
	const username = ctx.from.username;

	const allowedUsernames = process.env.ALLOWED_USERNAMES
		? process.env.ALLOWED_USERNAMES.split(",")
		: [];

	if (
		!allowedUsernames
			.map((name) => name.toLowerCase())
			.includes(username.toLowerCase())
	) {
		ctx.reply("You are not authorized to use this bot.");
		return false;
	}
	return true;
}
