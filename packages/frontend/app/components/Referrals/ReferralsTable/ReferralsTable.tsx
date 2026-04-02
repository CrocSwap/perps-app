import { memo } from 'react';
import styles from './ReferralsTable.module.css';
import ReferralsTableHeader from './ReferralsTableHeader';
import ReferralsTableRow from './ReferralsTableRow';
import type {
    PayoutByReferrerT,
    PayoutMovementIF,
} from '~/routes/referrals/referrals';

interface PropsIF {
    payoutMovements: PayoutMovementIF[];
    payoutsByReferrer: PayoutByReferrerT[];
}

function ReferralsTable(props: PropsIF) {
    const { payoutsByReferrer } = props;

    return (
        <div className={styles.tableWrapper}>
            <ReferralsTableHeader sortConfig={null} onSort={() => {}} />
            <div className={styles.tableBody}>
                {payoutsByReferrer.map((referral, index) => (
                    <ReferralsTableRow
                        key={`referral-${index}`}
                        referral={referral}
                    />
                ))}

                {payoutsByReferrer.length === 0 && (
                    <div className={styles.emptyState}>No data to display</div>
                )}
            </div>
        </div>
    );
}

export default memo(ReferralsTable);
