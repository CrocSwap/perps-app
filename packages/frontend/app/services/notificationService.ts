import { t } from 'i18next';

export interface NotificationOptions {
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    duration?: number; // in milliseconds, default 5000
    persistent?: boolean; // whether notification stays until manually dismissed
}

export interface TransactionNotificationOptions {
    signature?: string;
    amount?: number;
    token?: string;
}

/**
 * Service for managing transaction notifications
 */
export class NotificationService {
    private notifications: Map<string, NotificationOptions> = new Map();
    private listeners: Set<(notifications: NotificationOptions[]) => void> =
        new Set();

    /**
     * Add a notification
     */
    addNotification(id: string, options: NotificationOptions): void {
        this.notifications.set(id, options);
        this.notifyListeners();

        // Auto-remove notification after duration (unless persistent)
        if (!options.persistent) {
            const duration = options.duration || 5000;
            setTimeout(() => {
                this.removeNotification(id);
            }, duration);
        }
    }

    /**
     * Remove a notification
     */
    removeNotification(id: string): void {
        this.notifications.delete(id);
        this.notifyListeners();
    }

    /**
     * Get all notifications
     */
    getNotifications(): NotificationOptions[] {
        return Array.from(this.notifications.values());
    }

    /**
     * Subscribe to notification changes
     */
    subscribe(
        listener: (notifications: NotificationOptions[]) => void,
    ): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notify all listeners of changes
     */
    private notifyListeners(): void {
        const notifications = this.getNotifications();
        this.listeners.forEach((listener) => listener(notifications));
    }

    /**
     * Show a deposit transaction success notification
     */
    showDepositSuccess(options: TransactionNotificationOptions): void {
        const id = `deposit-success-${Date.now()}`;
        const amount = options.amount ? `${options.amount.toFixed(2)}` : '';
        const token = options.token || 'USD';

        this.addNotification(id, {
            type: 'success',
            title: t('transactions.depositSuccessful'),
            message: t('transactions.successfullyDeposited', {
                amount: amount,
                unit: token,
            }),
            duration: 7000,
        });
    }

    /**
     * Show a deposit transaction error notification
     */
    showDepositError(
        error: string,
        options: TransactionNotificationOptions = {},
    ): void {
        const id = `deposit-error-${Date.now()}`;

        this.addNotification(id, {
            type: 'error',
            title: t('transactions.depositFailed'),
            message: error,
            duration: 10000,
        });
    }

    /**
     * Show a transaction pending notification
     */
    showTransactionPending(options: TransactionNotificationOptions): void {
        const id = `transaction-pending-${Date.now()}`;

        this.addNotification(id, {
            type: 'info',
            title: 'Transaction Pending',
            message: `Your deposit transaction is being processed${options.signature ? ` (${options.signature.slice(0, 8)}...)` : ''}`,
            persistent: true, // Keep until we get confirmation
        });
    }

    /**
     * Clear all notifications
     */
    clearAll(): void {
        this.notifications.clear();
        this.notifyListeners();
    }
}

// Singleton instance
export const notificationService = new NotificationService();
