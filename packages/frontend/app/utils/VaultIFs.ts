export interface VaultFollowerStateIF {
    allTimePnl: string;
    daysFollowing: number;
    lockupUntil: number;
    pnl: string;
    user: string;
    vaultEntryTime: number;
    vaultEquity: string;
}

export interface VaultPortfolioHistoryIF {
    accountValueHistory: [number, string][];
    pnlHistory: [number, string][];
    vlm: string;
}

export type VaultPortfolioIF = [number, VaultPortfolioHistoryIF][];

export interface VaultDetailsIF {
    allowDeposits: boolean;
    apr: number;
    description: string;
    isClosed: boolean;
    leader: string;
    leaderCommission: number;
    leaderFraction: number;
    maxDistributable: number;
    maxWithdrawable: number;
    name: string;
    vaultAddress: string;
    followerState: VaultFollowerStateIF;
    followers: VaultFollowerStateIF[];
    portfolio: VaultPortfolioIF;
    relationship: {
        data: {
            childAddresses: string[];
        };
        type: string;
    };
}
