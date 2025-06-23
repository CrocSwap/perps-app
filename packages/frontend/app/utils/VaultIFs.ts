import type { TableSortDirection } from './CommonIFs';

export interface VaultFollowerStateRawIF {
    allTimePnl: string;
    daysFollowing: number;
    lockupUntil: number;
    pnl: string;
    user: string;
    vaultEntryTime: number;
    vaultEquity: string;
}

export interface VaultPortfolioHistoryRawIF {
    accountValueHistory: [number, string][];
    pnlHistory: [number, string][];
    vlm: string;
}

export type VaultPortfolioRawIF = [number, VaultPortfolioHistoryRawIF][];

export interface VaultDetailsRawIF {
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
    followerState: VaultFollowerStateRawIF | null;
    followers: VaultFollowerStateRawIF[];
    portfolio: VaultPortfolioRawIF;
    relationship: {
        data: {
            childAddresses: string[];
        };
        type: string;
    };
}

export interface VaultFollowerStateIF {
    allTimePnl: number;
    daysFollowing: number;
    lockupUntil: number;
    pnl: number;
    user: string;
    vaultEntryTime: number;
    vaultEquity: number;
}

export interface VaultPortfolioHistoryIF {
    accountValueHistory: [number, number][];
    pnlHistory: [number, number][];
    vlm: number;
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
    followerState: VaultFollowerStateIF | null;
    followers: VaultFollowerStateIF[];
    portfolio: VaultPortfolioIF;
    relationship: {
        data: {
            childAddresses: string[];
        };
        type: string;
    };
    tvl?: number;
    capacity?: number;
    pnl?: number;
}

export type VaultDepositorSortBy =
    | 'allTimePnl'
    | 'daysFollowing'
    | 'lockupUntil'
    | 'pnl'
    | 'user'
    | 'vaultEntryTime'
    | 'vaultEquity'
    | undefined;

export const sortVaultDepositors = (
    depositors: VaultFollowerStateIF[],
    sortBy: VaultDepositorSortBy,
    sortDirection: TableSortDirection,
) => {
    if (sortDirection && sortBy) {
        switch (sortBy) {
            case 'allTimePnl':
                return [...depositors].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.allTimePnl - b.allTimePnl
                        : b.allTimePnl - a.allTimePnl,
                );
            case 'daysFollowing':
                return [...depositors].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.daysFollowing - b.daysFollowing
                        : b.daysFollowing - a.daysFollowing,
                );
            case 'pnl':
                return [...depositors].sort((a, b) =>
                    sortDirection === 'asc' ? a.pnl - b.pnl : b.pnl - a.pnl,
                );
            case 'vaultEquity':
                return [...depositors].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.vaultEquity - b.vaultEquity
                        : b.vaultEquity - a.vaultEquity,
                );
            default:
                return depositors;
        }
    }
    return depositors;
};
