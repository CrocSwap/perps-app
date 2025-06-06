import { useNavigate } from 'react-router';
import styles from './NoConnectionIndicator.module.css';
import { MdSignalWifiConnectedNoInternet0 } from 'react-icons/md';
import { motion } from 'framer-motion';

export default function NoConnectionIndicator() {
    return (
        <motion.div
            className={styles.noConnectionIndicator}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className={styles.noConnectionIndicatorContent}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <MdSignalWifiConnectedNoInternet0
                        size={72}
                        className={styles.noConnectionIndicatorIcon}
                    />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className={styles.noConnectionIndicatorText}
                >
                    <h1>No Connection</h1>
                    <p>Please check your internet connection and try again.</p>
                </motion.div>
            </div>
        </motion.div>
    );
}
