import { getDLMMPools } from "./api/meteora.js";
import { sendChunkedPoolInformation } from "./bot/commandHandlers.js";
import PoolVolume from "./models/poolsVolume.js";
import Subscription from "./models/subscription.js";

export async function fetchVolumeDataAndUpdate() {
	try {
		consloe.log("Fetching DEX data...");
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
					update: {
						$push: {
							volumes: {
								$each: [volumeEntry],
								$slice: -10
							}
						}
					},
					upsert: true
				}
			};
		});

		await PoolVolume.bulkWrite(bulkOps);
		console.log(
			"DEX data fetched and updated successfully using bulk operations."
		);

		await notifyIncreasingVolumePools(dexDataList);
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
 */
async function notifyNewPools(dexDataList) {
	try {
		const apiPoolAddresses = dexDataList.map((dexData) => dexData.address);

		const existingPools = await PoolVolume.find(
			{ poolAddress: { $in: apiPoolAddresses } },
			{ poolAddress: 1 }
		);
		const existingPoolAddresses = existingPools.map(
			(pool) => pool.poolAddress
		);

		const newPools = dexDataList.filter(
			(pool) => !existingPoolAddresses.includes(pool.address)
		);

		if (newPools.length > 0 && existingPoolAddresses.length > 0) {
			const subscriptions = await Subscription.find({ newPools: true });
			const messages = subscriptions.map((subscription) => {
				return sendChunkedPoolInformation(
					subscription.chatId,
					newPools,
					[{ field: "liquidity", order: "desc" }],
					newPools.length,
					`New pools found: ${newPools.length}`
				);
			});

			await Promise.all(messages);
			console.log("Successfully notified new pools.");
		} else {
			console.log("No new pools found.");
		}
	} catch (error) {
		console.error("Error notifying increasing volume pools:", error);
	}
}

async function notifyIncreasingVolumePools(dexDataList) {
	try {
		const increasingVolumePools = await PoolVolume.aggregate([
			{ $match: { "volumes.4": { $exists: true } } },
			{
				$project: {
					poolAddress: 1,
					volumes: { $slice: ["$volumes", -5] }
				}
			},
			{
				$addFields: {
					isIncreasing: {
						$and: [
							{
								$lt: [
									{ $arrayElemAt: ["$volumes.volume", 0] },
									{ $arrayElemAt: ["$volumes.volume", 1] }
								]
							},
							{
								$lt: [
									{ $arrayElemAt: ["$volumes.volume", 1] },
									{ $arrayElemAt: ["$volumes.volume", 2] }
								]
							},
							{
								$lt: [
									{ $arrayElemAt: ["$volumes.volume", 2] },
									{ $arrayElemAt: ["$volumes.volume", 3] }
								]
							},
							{
								$lt: [
									{ $arrayElemAt: ["$volumes.volume", 3] },
									{ $arrayElemAt: ["$volumes.volume", 4] }
								]
							}
						]
					}
				}
			},
			{ $match: { isIncreasing: true } }
		]);

		if (increasingVolumePools.length > 0) {
			const increasingVolumePoolAddresses = increasingVolumePools.map(
				(pool) => pool.poolAddress
			);
			const filteredPools = dexDataList.filter((pool) =>
				increasingVolumePoolAddresses.includes(pool.address)
			);

			if (filteredPools.length > 0) {
				const subscriptions = await Subscription.find({
					increasedVolume: true
				});
				const messages = subscriptions.map((subscription) => {
					return sendChunkedPoolInformation(
						subscription.chatId,
						filteredPools,
						[{ field: "liquidity", order: "desc" }],
						filteredPools.length,
						`Pools with increasing volume over the last 5 hours: ${filteredPools.length}`
					);
				});
				await Promise.all(messages);
				console.log("Successfully notified increasing volume pools.");
			} else {
				console.log(
					"No pools with increasing volume over the last 5 hours."
				);
			}
		}
	} catch (error) {
		console.error("Error notifying increasing volume pools:", error);
	}
}
