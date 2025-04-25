import styles from './Notifications.module.css';
import Notification from './Notification';
import { useAppOptions } from '~/stores/AppOptionsStore';
import {
    makeOID,
    useNotificationStore,
    type notificationIF,
    type NotificationStoreIF,
} from '~/stores/NotificationStore';
import { useDebugStore } from '~/stores/DebugStore';
import { useCallback, useEffect, useRef } from 'react';
import { useSdk } from '~/hooks/useSdk';
import { WsChannels } from '~/utils/Constants';

export default function Notifications() {
    // boolean to suppress notifications if toggled by user
    const { enableTxNotifications, enableBackgroundFillNotif } =
        useAppOptions();

    // notification data from which to generate DOM elements
    const data: NotificationStoreIF = useNotificationStore();

    const backgroundFillNotifRef = useRef(false);
    backgroundFillNotifRef.current = enableBackgroundFillNotif;

    // debug store to import sample wallet addres to use
    const { debugWallet } = useDebugStore();

    const { info } = useSdk();

    // use effect to subscribe to notifications
    useEffect(() => {
        if (!info) return;
        if (!debugWallet.address) return;

        const { unsubscribe } = info.subscribe(
            {
                type: WsChannels.NOTIFICATION,
                user: debugWallet.address,
            },
            postNotification,
        );

        return unsubscribe;
    }, [debugWallet, info]);

    const postNotification = useCallback((payload: any) => {
        if (backgroundFillNotifRef.current && payload.notification) {
            // split the payload into title and message
            const title = payload.notification.split(':')[0];
            const message = payload.notification.split(':')[1];

            // add to store
            data.addFromWS({
                title: title,
                message: message,
                icon: 'check',
                oid: makeOID(14),
            });
        }
    }, []);

    return (
        <div className={styles.notifications}>
            {enableTxNotifications &&
                data.notifications.map((n: notificationIF) => (
                    <Notification
                        key={JSON.stringify(n)}
                        data={n}
                        dismiss={data.remove}
                    />
                ))}
        </div>
    );
}
