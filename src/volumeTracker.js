import { getDLMMPools } from "./api/meteora.js";
import { bot } from "./api/telegram.js";
import PoolVolume from "./models/poolsVolume.js";
import Subscription from "./models/subscription.js";

export async function fetchVolumeDataAndUpdate() {
	try {
		const dexDataList = await getDLMMPools();

		await notifyNewPools(dexDataList);

		const bulkOps = dexDataList.map((dexData) => {
			const poolAddress = dexData.address;
			const timestamp = new Date();
			const volumeEntry = {
				timestamp,
				volume: dexData.trade_volume_24h
			};

			return {
				updateOne: {
					filter: { poolAddress },
					update: { $push: { volumes: volumeEntry } },
					upsert: true
				}
			};
		});

		await PoolVolume.bulkWrite(bulkOps);
		console.log(
			"DEX data fetched and updated successfully using bulk operations."
		);
	} catch (err) {
		console.error("Error fetching DEX data:", err);
	}
}

/**
 * Identifies new pool addresses by comparing a list of API pool addresses
 * against existing pool addresses in the database.
 *
 * @async
 * @function findNewPoolAddresses
 * @param {Array<Object>} dexDataList - An array of API pool objects.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of new pool addresses.
 */
async function notifyNewPools(dexDataList) {
	const apiPoolAddresses = dexDataList.map((dexData) => dexData.address);

	const existingPools = await PoolVolume.find(
		{ poolAddress: { $in: apiPoolAddresses } },
		{ poolAddress: 1 }
	);
	const existingPoolAddresses = existingPools.map((pool) => pool.poolAddress);

	const newPoolAddresses = apiPoolAddresses.filter(
		(address) => !existingPoolAddresses.includes(address)
	);

	if (newPoolAddresses.length > 0 && existingPoolAddresses.length > 0) {
		const subscriptions = await Subscription.find({ newPools: true });
		const messages = subscriptions.map((subscription) => {
			return bot.telegram.sendMessage(
				subscription.chatId,
				newPoolAddresses.join("\n"),
				{
					parse_mode: "HTML",
					// @ts-ignore
					disable_web_page_preview: true
				}
			);
		});

		await Promise.all(messages);
	}

	return newPoolAddresses;
}
