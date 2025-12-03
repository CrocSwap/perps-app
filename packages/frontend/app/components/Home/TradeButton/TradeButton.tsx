import { Link, useNavigation } from 'react-router';
import styles from './TradeButton.module.css';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { t } from 'i18next';

export default function TradeButton() {
    const navigation = useNavigation();
    const { symbol } = useTradeDataStore();
    const isNavigating = navigation.state !== 'idle';

    return (
        <Link
            to={`/v2/trade/${symbol}`}
            className={styles.tradeButton}
            viewTransition
        >
            {isNavigating ? t('common.loading') : t('home.startTrading')}
        </Link>
    );
}
