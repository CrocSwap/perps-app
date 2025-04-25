import type { ReferralData } from './data';
import styles from './ReferralsTable.module.css';

interface ReferralsTableRowProps {
    referral: ReferralData;
}

export default function ReferralsTableRow({ referral }: ReferralsTableRowProps) {
    return (
        <div className={styles.rowContainer}>
            <div className={`${styles.cell} ${styles.addressCell}`}>
                {referral.address}
            </div>
            <div className={`${styles.cell} ${styles.dateJoinedCell}`}>
                {referral.dateJoined}
            </div>
            <div className={`${styles.cell} ${styles.volumeCell}`}>
                {referral.totalVolume}
            </div>
            <div className={`${styles.cell} ${styles.feesCell}`}>
                {referral.feesPaid}
            </div>
            <div className={`${styles.cell} ${styles.rewardsCell}`}>
                {referral.yourRewards}
            </div>
        </div>
    );
}