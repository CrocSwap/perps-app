/**
 * Maps trading symbols to their corresponding Ambient spot trading URLs.
 * Symbol matching is case-insensitive.
 */

const AMBIENT_BASE_URL = 'https://ambient.finance/trade';

// Map of lowercase symbols to their full Ambient trading URLs
const symbolToUrlMap: Record<string, string> = {
    btc: `${AMBIENT_BASE_URL}/market/chain=0x82750&tokenA=0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4&tokenB=0x3c1bca5a656e69edcd0d4e36bebb3fcdaca60cf1`,
    eth: `${AMBIENT_BASE_URL}/market/chain=0x82750&tokenA=0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4&tokenB=0x0000000000000000000000000000000000000000`,
    sol: `${AMBIENT_BASE_URL}/market/chain=0x82750&tokenA=0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4&tokenB=0xcdf95e1f720caade4b1dc83abfe15400d2a458ad`,
};

/**
 * Returns the Ambient spot trading URL for a given symbol.
 * Falls back to the base trading URL if no mapping exists.
 *
 * @param symbol - The trading symbol (case-insensitive)
 * @returns The corresponding Ambient trading URL
 */
export function getAmbientSpotUrl(symbol: string): string {
    const normalizedSymbol = symbol.toLowerCase();
    return symbolToUrlMap[normalizedSymbol] ?? AMBIENT_BASE_URL;
}

export { AMBIENT_BASE_URL };
