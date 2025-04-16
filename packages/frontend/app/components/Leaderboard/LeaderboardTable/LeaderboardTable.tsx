import { memo, useMemo } from 'react';
import LeaderboardTableHeader from './LeaderboardTableHeader';
import LeaderboardTableRow, {
    type LeaderboardData,
} from './LeaderboardTableRow';
import styles from './LeaderboardTable.module.css';

interface LeaderboardTableProps {
    data: LeaderboardData[];
    sortConfig: {
        key: string;
        direction: 'asc' | 'desc' | null;
    };
    onSort: (key: string) => void;
    isFullScreen: boolean;
}

function LeaderboardTable({
    data,
    sortConfig,
    onSort,
    isFullScreen,
}: LeaderboardTableProps) {
    // Memoize to prevent recalculation on every render

    const wrapperClassName = useMemo(() => {
        return `${styles.tableWrapper} ${isFullScreen ? styles.fullScreen : ''}`;
    }, [isFullScreen]);

    // Memoize to prevent recreation on every render if data hasn't changed
    const tableBody = useMemo(() => {
        return data.length > 0 ? (
            data.map((item) => (
                <MemoizedLeaderboardTableRow
                    key={`leader-${item.trader}`}
                    data={item}
                />
            ))
        ) : (
            <div className={styles.emptyState}>
                No leaderboard data available
            </div>
        );
    }, [data]);

    return (
        <div className={wrapperClassName}>
            <MemoizedLeaderboardTableHeader
                sortConfig={sortConfig}
                onSort={onSort}
            />
            <div className={styles.tableBody}>{tableBody}</div>
        </div>
    );
}

// Memoize to prevent unnecessary re-renders
const MemoizedLeaderboardTableRow = memo(LeaderboardTableRow);
const MemoizedLeaderboardTableHeader = memo(LeaderboardTableHeader);

export default memo(LeaderboardTable);
