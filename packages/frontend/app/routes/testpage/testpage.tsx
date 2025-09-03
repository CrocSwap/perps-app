import { useCallback } from 'react';
import PortfolioWithdraw from '~/components/Portfolio/PortfolioWithdraw/PortfolioWithdraw';
import { useNotificationStore } from '~/stores/NotificationStore';
import styles from './testpage.module.css';

export default function TestPage() {
    const { add } = useNotificationStore();

    const handleTestNotification = useCallback(() => {
        add({
            title: 'Test Notification',
            message:
                'This is a test message to check the stacked notifications.',
            icon: 'check', // can be 'spinner', 'check', or 'error'
        });
    }, [add]);

    return (
        <div className={styles.testpage}>
            <button onClick={handleTestNotification}>
                Trigger Test Notification
            </button>
        </div>
    );
}
