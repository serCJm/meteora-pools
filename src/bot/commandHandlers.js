import { getDLMMPools } from "../api/meteora.js";
import { bot } from "../api/telegram.js";
import Subscription from "../models/subscription.js";
import {
	parsePoolsCommand,
	parseSubscriptionCommand
} from "./commandParser.js";
import { filterPools, formatResponse, sortPools } from "./dataHandler.js";
import { HELP_MESSAGE } from "./helpMessage.js";

/**
 * Handles the `/pools` command, retrieving and displaying filtered and sorted DLMM pools.
 *
 * @param {Object} ctx - The Telegram context object.
 * @async
 */
export async function poolsHandler(ctx) {
	if (!isAllowedUser(ctx)) return;
	const command = ctx.message.text.substring(6);
	try {
		const { sortFields, filterCriteria } = parsePoolsCommand(command);
		const pools = await getDLMMPools();

		const filteredPools = filterPools(pools, filterCriteria);

		if (filteredPools.length === 0) {
			ctx.reply("No pools found matching your criteria.");
			return;
		}
		await sendChunkedPoolInformation(
			ctx.chat.id,
			filteredPools,
			sortFields
		);
	} catch (error) {
		console.error("Error processing pools:", error);
		ctx.reply(`Error getting pools information`);
	}
}

/**
 * Sends a chunked response with pool information to the user.
 *
 * Sorts and formats pool data, then sends it to the user in chunks
 * to avoid exceeding message length limits.  Handles potential errors
 * during the sending process.
 *
 * @param {Number} chatId The chat ID of the user to send the pool information to.
 * @param {Array<Object>} pools An array of pool objects that match the user's filter criteria.
 * @param {Array<Object>} sortFields An array of fields to sort the pools by.
 */
export async function sendChunkedPoolInformation(
	chatId,
	pools,
	sortFields = [{ field: "liquidity", order: "desc" }],
	itemsToSend = 10
) {
	const sortedPools = sortPools(pools, sortFields);
	const formattedResponse = formatResponse(sortedPools);

	try {
		const responsesToSend = formattedResponse.slice(0, itemsToSend);

		const chunkSize = 5;
		for (let i = 0; i < responsesToSend.length; i += chunkSize) {
			const chunk = responsesToSend.slice(i, i + chunkSize);
			const message = chunk.join("\n");

			await bot.telegram.sendMessage(chatId, message, {
				parse_mode: "HTML",
				// @ts-ignore
				disable_web_page_preview: true
			});
		}
	} catch (error) {
		console.error("Error sending pool information:", error);
		bot.telegram.sendMessage(
			chatId,
			"An error occurred while sending the pool information. Please try again later."
		);
	}
}

/**
 * Handles the `/subscribe` command, allowing users to subscribe to notifications.
 *
 * @param {Object} ctx The Telegram context object.
 * @async
 */
export async function subscribeHandler(ctx) {
	if (!isAllowedUser(ctx)) return;
	try {
		const userId = ctx.from.id;
		const chatId = ctx.chat.id;

		const subscribeTo = parseSubscriptionCommand(
			ctx.message.text.substring(10)
		);

		await Subscription.findOneAndUpdate(
			{ userId },
			{
				chatId,
				newPools: subscribeTo.includes("newPools"),
				increasedVolume: subscribeTo.includes("increasedVolume")
			},
			{ upsert: true, new: true }
		);
		ctx.reply("You have successfully subscribed to notifications.");
	} catch (error) {
		console.error("Error in subscribeHandler:", error);
		ctx.reply(
			"An error occurred while subscribing. Please try again later."
		);
	}
}

/**
 * Handles the `/unsubscribe` command, allowing users to unsubscribe from notifications.
 *
 * @param {Object} ctx The Telegram context object.
 * @async
 */
export async function unsubscribeHandler(ctx) {
	if (!isAllowedUser(ctx)) return;
	try {
		const userId = ctx.from.id;
		const chatId = ctx.chat.id;

		const unsubscribeFrom = parseSubscriptionCommand(
			ctx.message.text.substring(12)
		);

		const query = { userId, chatId };
		if (unsubscribeFrom.length > 0) {
			const update = {};
			if (unsubscribeFrom.includes("newPools")) {
				update.newPools = false;
			}
			if (unsubscribeFrom.includes("increasedVolume")) {
				update.increasedVolume = false;
			}
			await Subscription.updateOne(query, update);
			ctx.reply("Your subscription has been updated.");
		} else {
			const deletedResult = await Subscription.deleteOne(query);
			if (deletedResult.deletedCount > 0) {
				ctx.reply(
					"You have successfully unsubscribed from all notifications."
				);
			} else {
				ctx.reply("You were not subscribed to any notifications.");
			}
		}
	} catch (error) {
		console.error("Error in unsubscribeHandler:", error);
		ctx.reply(
			"An error occurred while unsubscribing. Please try again later."
		);
	}
}

/**
 * Handles the `/help` command, displaying the bot's help message.
 *
 * @param {Object} ctx - The Telegram context object.
 * @async
 */
export async function helpHandler(ctx) {
	if (!isAllowedUser(ctx)) return;
	try {
		ctx.reply(HELP_MESSAGE, { parse_mode: "HTML" });
	} catch (error) {
		ctx.reply(`Error: ${error.message}`);
	}
}

/**
 * Checks if the user who sent the message is allowed to use the bot.
 *
 * @param {import('telegraf').Context} ctx The Telegraf context object.
 * @returns {boolean} True if the user is allowed, false otherwise.
 */
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
