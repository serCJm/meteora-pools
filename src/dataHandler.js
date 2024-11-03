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
	console.log(filterCriteria);
	return pools.filter((pool) => {
		for (const field in filterCriteria) {
			const mappedField = FIELD_MAPPING[field] || field;
			const criteria = filterCriteria[field];

			let isValid = false;

			if (
				typeof criteria === "object" &&
				criteria.operator &&
				criteria.value
			) {
				const { operator, value } = criteria;
				const poolValue = Number(pool[mappedField]);

				switch (operator) {
					case ">":
						isValid = poolValue > value;
						break;
					case "<":
						isValid = poolValue < value;
						break;
					case ">=":
						isValid = poolValue >= value;
						break;
					case "<=":
						isValid = poolValue <= value;
						break;
					case "=":
						isValid = poolValue === value;
						break;
					default:
						console.warn(`Unknown operator: ${operator}`);
						isValid = false;
				}
			} else {
				isValid =
					pool.hasOwnProperty(mappedField) &&
					pool[mappedField] === criteria;
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
		const token1Address = pool.reserve_x || "N/A";
		const token2Address = pool.reserve_y || "N/A";

		const binStep = pool.bin_step?.toString() || "N/A";
		const liquidity = Number(pool.liquidity).toFixed(2).toString() || "N/A";
		const fee = pool.fees_24h?.toFixed(2).toString() || "N/A";
		const volume =
			Number(pool.trade_volume_24h).toFixed(2).toString() || "N/A";

		const link = `https://edge.meteora.ag/dlmm/${address}`;

		return (
			`<b>${index + 1}. <a href="${link}">${name}</a></b>\n` +
			`Pool: <code>${address}</code>\n` +
			`${token1Name}: <code>${token1Address}</code>\n` +
			`${token2Name}: <code>${token2Address}</code>\n` +
			`Bin Step: ${binStep}\n` +
			`Liquidity: ${liquidity}\n` +
			`Fees: ${fee}\n` +
			`Volume: ${volume}\n\n` +
			`<a href="https://dexscreener.com/solana/${address}">DexScreener</a> | <a href="https://gmgn.ai/sol/token/${token1Address}">GMGN Token1</a> | <a href="https://gmgn.ai/sol/token/${token2Address}">GMGN Token2</a>\n`
		);
	});
}
