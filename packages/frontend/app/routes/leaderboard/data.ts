import type { LeaderboardData } from '~/components/Leaderboard/LeaderboardTable/LeaderboardTableRow';

// Utility function to generate random wallet addresses
const generateWalletAddress = () => {
    const chars = '0123456789abcdef';
    let address = '0x';

    // Generate 40 hex characters (standard ETH address length)
    for (let i = 0; i < 40; i++) {
        address += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Return truncated version for display
    return address.substring(0, 6) + '...' + address.substring(38);
};

// Utility to format numbers with commas
const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: num >= 1000000 ? 0 : 2,
        maximumFractionDigits: num >= 1000000 ? 0 : 2,
    });
};

// Generate 100 entries for the leaderboard
export const leaderboardData: LeaderboardData[] = Array.from(
    { length: 100 },
    (_, i) => {
        // Create more varied data for pagination demonstration
        const rank = i + 1;
        const isPnlPositive = Math.random() > 0.3; // 70% chance of positive PNL
        const isRoiPositive = isPnlPositive; // Usually correlates with PNL

        // Generate random values with realistic ranges
        const accountValue = 100000000000 - rank * 985432156;
        const pnlValue = isPnlPositive
            ? Math.random() * 2000000000
            : -Math.random() * 500000000;
        const roiPercentage = isRoiPositive
            ? (Math.random() * 25).toFixed(2)
            : (-Math.random() * 15).toFixed(2);
        const volumeValue = 150000000 - rank * 241352;

        return {
            rank,
            trader: generateWalletAddress(),
            accountValue: formatNumber(Math.max(10000000, accountValue)),
            pnl: formatNumber(pnlValue),
            isPnlPositive,
            roi: `${roiPercentage}%`,
            isRoiPositive,
            volume: formatNumber(Math.max(1000000, volumeValue)),
        };
    },
);
