import { getDLMMPools } from "./api/meteora.js";
import PoolVolume from "./models/poolsVolume.js";

export async function fetchVolumeDataAndUpdate() {
	try {
		const dexDataList = await getDLMMPools();

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
