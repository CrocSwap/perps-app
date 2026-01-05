import { motion } from 'framer-motion';
import { MdSignalWifiConnectedNoInternet0 } from 'react-icons/md';
import { t } from 'i18next';
import styles from './NoConnectionIndicator.module.css';

export default function NoConnectionIndicator() {
    return (
        <motion.div
            className={styles.offlineBanner}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
        >
            <MdSignalWifiConnectedNoInternet0
                size={20}
                className={styles.offlineIcon}
            />
            <div className={styles.offlineText}>
                <span className={styles.offlineTitle}>
                    {t('offline.title', 'You are offline')}
                </span>
                <span className={styles.offlineMessage}>
                    {t(
                        'offline.message',
                        'Trading is disabled. You can still view cached data.',
                    )}
                </span>
            </div>
        </motion.div>
    );
}
