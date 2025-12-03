import type {
    PayoutByReferrerEarningsT,
    PayoutByReferrerT,
} from '~/routes/referrals/referrals';
import styles from './ReferralsTable.module.css';
import truncString from '~/utils/functions/truncString';
import useNumFormatter from '~/hooks/useNumFormatter';

interface PropsIF {
    referral: PayoutByReferrerT;
}

export default function ReferralsTableRow(props: PropsIF) {
    const { referral } = props;

    // logic to format a number for localized currency
    const { formatNum } = useNumFormatter();

    // prop `referral` is an object with a single key-value pair
    // key → wallet address for user
    // value → object with fee and rewards data
    const [address, data] = Object.entries(referral)[0];

    return (
        <div className={styles.rowContainer}>
            <div className={`${styles.cell} ${styles.addressCell}`}>
                {truncString(address, 5, 5)}
            </div>
            <div className={`${styles.cell} ${styles.volumeCell}`}>
                {formatNum(data.volume, 2, true, true)}
            </div>
            <div className={`${styles.cell} ${styles.feesCell}`}>
                {formatNum(0, 2, true, true)}
            </div>
            <div className={`${styles.cell} ${styles.rewardsCell}`}>
                {formatNum(
                    // sum of all the 'amount' fields across chains
                    data.earnings.reduce(
                        (acc: number, current: PayoutByReferrerEarningsT) =>
                            acc + current.amount,
                        0,
                    ),
                    2,
                    true,
                    true,
                )}
            </div>
        </div>
    );
}
