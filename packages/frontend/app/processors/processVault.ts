import type {
    VaultDetailsRawIF,
    VaultDetailsIF,
    VaultPortfolioHistoryRawIF,
    VaultPortfolioHistoryIF,
    VaultFollowerStateIF,
    VaultFollowerStateRawIF,
} from '~/utils/VaultIFs';

export function processVaultDetails(raw: VaultDetailsRawIF): VaultDetailsIF {
    const processFollower = (
        f: VaultFollowerStateRawIF,
    ): VaultFollowerStateIF => ({
        allTimePnl: parseFloat(f.allTimePnl),
        daysFollowing: f.daysFollowing,
        lockupUntil: f.lockupUntil,
        pnl: parseFloat(f.pnl),
        user: f.user,
        vaultEntryTime: f.vaultEntryTime,
        vaultEquity: parseFloat(f.vaultEquity),
    });

    const processPortfolioHistory = (
        rawHistory: VaultPortfolioHistoryRawIF,
    ): VaultPortfolioHistoryIF => ({
        accountValueHistory: rawHistory.accountValueHistory.map(([t, v]) => [
            t,
            parseFloat(v),
        ]),
        pnlHistory: rawHistory.pnlHistory.map(([t, v]) => [t, parseFloat(v)]),
        vlm: parseFloat(rawHistory.vlm),
    });

    const followers = raw.followers.map(processFollower);

    const tvl = followers.reduce((sum, f) => sum + f.vaultEquity, 0);
    const pnl = followers.reduce((sum, f) => sum + f.pnl, 0);

    const processed: VaultDetailsIF = {
        allowDeposits: raw.allowDeposits,
        apr: raw.apr,
        description: raw.description,
        isClosed: raw.isClosed,
        leader: raw.leader,
        leaderCommission: raw.leaderCommission,
        leaderFraction: raw.leaderFraction,
        maxDistributable: raw.maxDistributable,
        maxWithdrawable: raw.maxWithdrawable,
        name: raw.name,
        vaultAddress: raw.vaultAddress,
        followerState: raw.followerState
            ? processFollower(raw.followerState)
            : null,
        followers: followers,
        portfolio: raw.portfolio.map(([timestamp, history]) => [
            timestamp,
            processPortfolioHistory(history),
        ]),
        relationship: raw.relationship,

        tvl: tvl,
        // capacity: undefined,
        pnl: pnl,
    };

    return processed;
}
