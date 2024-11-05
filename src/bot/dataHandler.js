const FIELD_MAPPING = {
	fees: "fees_24h",
	liquidity: "liquidity",
	volume: "trade_volume_24h",
	apr: "apr"
};

export function sortPools(pools, sortFields) {
	return [...pools].sort((a, b) => {
		for (const sortField of sortFields) {
			const { field, direction } = sortField;
			const mappedField = FIELD_MAPPING[field] || field;

			const aValue = Number(a[mappedField]);
			const bValue = Number(b[mappedField]);

			if (isNaN(aValue)) return 1;
			if (isNaN(bValue)) return -1;

			if (aValue < bValue) return direction === "asc" ? -1 : 1;
			if (aValue > bValue) return direction === "asc" ? 1 : -1;
		}
		return 0;
	});
}

/**
 * Filters the pools based on the given criteria.
 * @param {Array<Object>} pools - Array of pool objects.
 * @param {Object} filterCriteria - Filter criteria.
 * @returns {Array<Object>} - Filtered array of pool objects.
 */
export function filterPools(pools, filterCriteria) {
	return pools.filter((pool) => {
		for (const field in filterCriteria) {
			const mappedField = FIELD_MAPPING[field] || field;
			const criteriaArray = filterCriteria[field];
			const poolValue = Number(pool[mappedField]);

			let isValid = true;

			for (const criteria of criteriaArray) {
				let conditionValid = true;

				if (
					typeof criteria === "object" &&
					criteria.operator &&
					criteria.value !== undefined
				) {
					const { operator, value } = criteria;

					switch (operator) {
						case ">":
							conditionValid = poolValue > value;
							break;
						case "<":
							conditionValid = poolValue < value;
							break;
						case ">=":
							conditionValid = poolValue >= value;
							break;
						case "<=":
							conditionValid = poolValue <= value;
							break;
						case "=":
						case "==":
							conditionValid = poolValue === value;
							break;
						default:
							console.warn(`Unknown operator: ${operator}`);
							conditionValid = false;
					}
				} else {
					conditionValid = pool[mappedField] === criteria;
				}

				if (!conditionValid) {
					isValid = false;
					break;
				}
			}

			if (!isValid) return false;
		}
		return true;
	});
}

/**
 * Formats the response for the user to be sent via Telegram using telegraf.
 * @param {Array<Object>} pools - Array of pool objects.
 * @returns {Array<string>} - Formatted HTML response string array.
 */
export function formatResponse(pools) {
	return pools.map((pool, index) => {
		const name = pool.name || "N/A";
		const address = pool.address || "N/A";

		const [token1, token2] = pool.name.split("-");
		const token1Name = token1.toUpperCase();
		const token2Name = token2.toUpperCase();
		const tokenName = token1Name === "SOL" ? token2Name : token1Name;
		const tokenAddress =
			token1Name === "SOL" ? pool.mint_y : pool.mint_x || "N/A";

		const binStep = pool.bin_step?.toString() || "N/A";
		const liquidity = Number(pool.liquidity).toFixed(2).toString() || "N/A";
		const fee = pool.fees_24h?.toFixed(2).toString() || "N/A";
		const volume =
			Number(pool.trade_volume_24h).toFixed(2).toString() || "N/A";

		const apr = Number(pool.apr).toFixed(2).toString() || "N/A";

		const link = `https://edge.meteora.ag/dlmm/${address}`;

		return (
			`<b>${index + 1}. <a href="${link}">${name}</a></b>\n` +
			`Pool: <code>${address}</code>\n` +
			`$${tokenName}: <code>${tokenAddress}</code>\n` +
			`Bin Step: ${binStep}\n` +
			`Liquidity: ${liquidity}\n` +
			`Fees24h: ${fee}\n` +
			`Volume24h: ${volume}\n\n` +
			`APR: ${apr}%\n\n` +
			`<a href="https://dexscreener.com/solana/${address}">DexScreener</a> | <a href="https://gmgn.ai/sol/token/${tokenAddress}">GMGN</a>\n`
		);
	});
}

export function recordVolume(pool, volume) {
	pool.volumeHistory = pool.volumeHistory || [];
	pool.volumeHistory.push({ timestamp: Date.now(), volume: volume });
}

export function analyzeVolumeChanges(pool, hours) {
	if (!pool.volumeHistory) return "No volume history available.";
	const cutoff = Date.now() - hours * 60 * 60 * 1000;
	const relevantHistory = pool.volumeHistory.filter(
		(entry) => entry.timestamp >= cutoff
	);
	if (relevantHistory.length < 2) return "Insufficient data for analysis.";
	const initialVolume = relevantHistory[0].volume;
	const finalVolume = relevantHistory[relevantHistory.length - 1].volume;
	const change = finalVolume - initialVolume;
	const percentageChange = (change / initialVolume) * 100;
	return `Volume change over ${hours} hours: ${change.toFixed(2)} (${percentageChange.toFixed(2)}%)`;
}

export async function handlePoolData(pools) {
	pools.forEach((pool) => recordVolume(pool, pool.trade_volume_24h));
	const filteredPools = filterPools(pools, {});
	const formattedResponse = formatResponse(filteredPools);
	return formattedResponse;
}

export function getVolumeAnalysis(pool, hours) {
	return analyzeVolumeChanges(pool, hours);
}
