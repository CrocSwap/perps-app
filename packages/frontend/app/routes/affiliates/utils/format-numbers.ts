/**
 * Format large numbers with K, M, B suffixes
 * @param value - The number to format
 * @returns Formatted string with suffix
 */
export function formatLargeNumber(value: number): string {
    if (value >= 1000000000) {
        return `${(value / 1000000000).toFixed(1)}B`;
    }
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 100000) {
        return `${Math.floor(value / 1000)}K`;
    }
    return value.toLocaleString();
}

/**
 * Format a number as USD currency
 * @param value - The number to format
 * @returns Formatted string with USD formatting
 */
export function formatUSD(value: number): string {
    return formatLargeNumber(value);
}

export function maskUserAddress(address: string): string {
    if (!address) return '';

    if (address.startsWith('0x') && address.length === 42) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    } else {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
}

export const formatTokenAmount = (
    amountInWei: number,
    decimals: number,
): string => {
    const amount = amountInWei / Math.pow(10, decimals);

    if (amount % 1 === 0) {
        return amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }

    if (amount >= 1) {
        const formatted = amount.toFixed(2).replace(/\.?0+$/, '');
        const [whole, decimal] = formatted.split('.');
        const wholeFormatted = Number(whole).toLocaleString('en-US');
        return decimal ? `${wholeFormatted}.${decimal}` : wholeFormatted;
    }

    return amount.toFixed(4).replace(/\.?0+$/, '');
};
