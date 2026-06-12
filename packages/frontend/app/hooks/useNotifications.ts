import { useEffect, useState } from 'react';
import { notificationService } from '~/services/notificationService';
import type { NotificationOptions } from '~/services/notificationService';

export function useNotifications() {
    const [notifications, setNotifications] = useState<NotificationOptions[]>(
        [],
    );

    useEffect(() => {
        // Subscribe to notification changes
        const unsubscribe = notificationService.subscribe(setNotifications);

        // Get initial notifications
        setNotifications(notificationService.getNotifications());

        return unsubscribe;
    }, []);

    return {
        notifications,
        clearAll: () => notificationService.clearAll(),
    };
}
