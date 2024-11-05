import got from "got";

/**
 * Retrieves the list of pools from the API.
 * @returns {Promise<Array<Pool>>} - Promise resolving to an array of pool objects.
 * @typedef {Object} Pool
 * @property {string} address - The address of the pool.
 * @property {string} name - The name of the pool (e.g., "BOGUS-SOL").
 * @property {string} mint_x - Mint address of token X.
 * @property {string} mint_y - Mint address of token Y.
 * @property {string} reserve_x - Reserve account address for token X.
 * @property {string} reserve_y - Reserve account address for token Y.
 * @property {number} reserve_x_amount - Amount of token X in reserve.
 * @property {number} reserve_y_amount - Amount of token Y in reserve.
 * @property {number} bin_step - Bin step size.
 * @property {string} base_fee_percentage - Base fee percentage.
 * @property {string} max_fee_percentage - Maximum fee percentage.
 * @property {string} protocol_fee_percentage - Protocol fee percentage.
 * @property {string} liquidity - Liquidity of the pool.
 * @property {string} reward_mint_x - Reward mint address for token X.
 * @property {string} reward_mint_y - Reward mint address for token Y.
 * @property {number} fees_24h - Fees collected in the last 24 hours.
 * @property {number} today_fees - Fees collected today.
 * @property {number} trade_volume_24h - 24-hour trade volume.
 * @property {string} cumulative_trade_volume - Cumulative trade volume.
 * @property {string} cumulative_fee_volume - Cumulative fee volume.
 * @property {number} current_price - Current price.
 * @property {number} apr - APR (Annual Percentage Rate).
 * @property {number} apy - APY (Annual Percentage Yield).
 * @property {number} farm_apr - Farm APR.
 * @property {number} farm_apy - Farm APY.
 * @property {boolean} hide - Whether the pool is hidden.
 */
export async function getDLMMPools() {
	try {
		const response = await got("https://dlmm-api.meteora.ag/pair/all");
		const pools = JSON.parse(response.body);

		const solPools = pools.filter((pool) => {
			return (
				pool.name.includes("SOL") &&
				!pool.name.includes("USDC") &&
				!pool.name.includes("USDT") &&
				+pool.liquidity > 100 &&
				pool.trade_volume_24h > 0 &&
				pool.fees_24h > 0
			);
		});

		return solPools;
	} catch (error) {
		console.error("Error fetching pools:", error);
		return [];
	}
}
