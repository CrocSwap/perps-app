import styles from './Notifications.module.css';
import Notification from './Notification';
import { useAppOptions } from '~/stores/AppOptionsStore';
import {
    makeOID,
    useNotificationStore,
    type notificationIF,
    type NotificationStoreIF
} from '~/stores/NotificationStore';
import { useKeydown } from '~/hooks/useKeydown';
import { useDebugStore } from '~/stores/DebugStore';
import { useEffect, useRef } from 'react';
import { useWsObserver } from '~/hooks/useWsObserver';

export default function Notifications() {
const hideNotificationsInDevelop = true

    // boolean to suppress notifications if toggled by user
    const { enableTxNotifications, enableBackgroundFillNotif } = useAppOptions();

    // notification data from which to generate DOM elements
    const data: NotificationStoreIF = useNotificationStore();

    // run fn `data.add` when the user presses the 'a' key
    useKeydown('a', data.add);    

    const backgroundFillNotifRef = useRef(false);
    backgroundFillNotifRef.current = enableBackgroundFillNotif;

    // debug store to import sample wallet addres to use
    const { debugWallet } = useDebugStore();

    // ws observer to subscribe to notifications
    const { subscribe, unsubscribeAllByChannel } = useWsObserver();

    // use effect to subscribe to notifications
    useEffect(() => {
        if(debugWallet.address){
            subscribe('notification', {
                payload: {
                    user: debugWallet.address
                },
                handler: (payload) => {
                    if(backgroundFillNotifRef.current && payload.notification){
                        // split the payload into title and message
                        const title = payload.notification.split(':')[0];
                        const message = payload.notification.split(':')[1];

                        // add to store
                        data.addFromWS({
                            title: title,
                            message: message,
                            icon: 'check',
                            oid: makeOID(14)
                        })
                    }
                },
                // that flag will generate a single subscription for this payload, 
                // will remove any existing subscription for this payload
                single: true 
            })
        }
        
    }, [debugWallet])

    
if ( hideNotificationsInDevelop) return null

    return (
        <div className={styles.notifications}>
            {
                enableTxNotifications && (
                    data.notifications.map((n: notificationIF) => (
                        <Notification
                            key={JSON.stringify(n)}
                            data={n}
                            dismiss={data.remove}
                        />
                    ))
                )
            }
        </div>
    );
}