export const HELP_MESSAGE = `
🤖 <b>Bot Help: Available Commands</b>


- Use /pools to search pools with various filtering and sorting options.
- To filter, use <code>-f</code> followed by a filter criterion.
- To sort, use <code>-s</code> followed by a sort criterion. <b>Sorting is always descending.</b>

<b>Filtering Options</b> (<code>-f</code> flag):
- <code>bin_step</code>: Filter by bin step value (default is 100 if not specified).
- <code>base_fee</code>: Filter by base transaction fee percentage, e.g., <code>-f base_fee_percentage&#61;&lt;0.5</code>.
- <code>max_fee</code>: Filter by the maximum transaction fee percentage.
- <code>protocol</code>: Filter by protocol-specific fee percentage (default is 0 if not specified).
- <code>liquidity</code>: Filter by liquidity, e.g., <code>-f liquidity&gt;5000</code> (default is &gt;0 if not specified).
- <code>fees</code>: Filter by fees collected in the last 24 hours.
- <code>volume</code>: Filter by trade volume in the last 24 hours.
- <code>apr</code>: Filter by annual percentage rate (APR), e.g., <code>-f apr&gt;&#61;0.02</code>.

<b>Sorting Options</b> (<code>-s</code> flag):
- Sorting is always in descending order. You can sort by any of the following:
  - <code>liquidity</code>: Sort by liquidity. This is default if no sorting option is provided.
  - <code>volume</code>: Sort by 24-hour trade volume.
  - <code>fees</code>: Sort by fees collected in the last 24 hours.
  - <code>apr</code>: Sort by APR (Annual Percentage Rate).

<b>Example Usage</b>:
/pools <code>-f liquidity&gt;5000 base_fee_percentage&#61;&lt;0.5 -s apr trade_volume_24h</code>
  - Filters for pools with liquidity over 5000 and a base fee percentage of 0.5% or less, then sorts by APR and 24-hour trade volume, both in descending order.
`;
