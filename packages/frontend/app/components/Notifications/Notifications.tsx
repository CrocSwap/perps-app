import type { NotificationMsg } from '@perps-app/sdk/src/utils/types';
import { AnimatePresence, motion } from 'framer-motion'; // <-- Import Framer Motion
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MdClose } from 'react-icons/md';
import { useLocation } from 'react-router';
import { useSdk } from '~/hooks/useSdk';
import { useVersionCheck } from '~/hooks/useVersionCheck';
import { useViewed } from '~/stores/AlreadySeenStore';
import { useAppOptions } from '~/stores/AppOptionsStore';
import {
    useNotificationStore,
    type notificationIF,
    type NotificationStoreIF,
} from '~/stores/NotificationStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { WsChannels } from '~/utils/Constants';
import SimpleButton from '../SimpleButton/SimpleButton';
import Notification from './Notification';
import styles from './Notifications.module.css';

interface NewsItemIF {
    headline: string;
    body: string;
    id: string;
}

export default function Notifications() {
    const { enableTxNotifications, enableBackgroundFillNotif } =
        useAppOptions();
    const data: NotificationStoreIF = useNotificationStore();
    const backgroundFillNotifRef = useRef(false);
    backgroundFillNotifRef.current = enableBackgroundFillNotif;
    const { userAddress } = useUserDataStore();
    const { info } = useSdk();

    const { showReload, setShowReload } = useVersionCheck();
    const [hoveredNotifications, setHoveredNotifications] = useState<
        Set<number>
    >(new Set());

    const handleMouseEnter = useCallback((slug: number) => {
        setHoveredNotifications((prev) => {
            // If the slug is already in the set, return previous state to prevent unnecessary re-renders
            if (prev.has(slug)) {
                console.log(
                    `[Hover] Already hovering over notification ${slug}`,
                );
                return prev;
            }

            // Create a new set with the new slug
            const newSet = new Set(prev);
            newSet.add(slug);
            console.log(
                `[Hover] Added hover for notification ${slug}, current hovers:`,
                Array.from(newSet),
            );
            return newSet;
        });
    }, []);

    const handleMouseLeave = useCallback((slug: number) => {
        setHoveredNotifications((prev) => {
            // If the set is already empty, return it as is
            if (prev.size === 0) {
                console.log(
                    `[Hover] MouseLeave on ${slug} but no hover states exist`,
                );
                return prev;
            }

            // If the slug isn't in the set, return previous state to prevent unnecessary re-renders
            if (!prev.has(slug)) {
                console.log(
                    `[Hover] MouseLeave on ${slug} but it's not in hover states:`,
                    Array.from(prev),
                );
                return prev;
            }

            // Create a new set without the slug
            const newSet = new Set(prev);
            newSet.delete(slug);

            // Return a new empty set if no hovers remain, otherwise return the updated set
            const result =
                newSet.size === 0 ? new Set<number>() : new Set(newSet);
            console.log(
                `[Hover] Removed hover for notification ${slug}, remaining hovers:`,
                result.size === 0 ? 'none' : Array.from(result),
            );

            return result;
        });
    }, []);

    // Effect to clean up hover states when notifications change
    useEffect(() => {
        const currentSlugs = new Set(data.notifications.map((n) => n.slug));

        setHoveredNotifications((prev) => {
            // If there are no hovered notifications, nothing to do
            if (prev.size === 0) return prev;

            // Check if any hovered notifications no longer exist
            const hasStaleHovers = Array.from(prev).some(
                (slug) => !currentSlugs.has(slug),
            );

            // If all hovered notifications still exist, return previous state
            if (!hasStaleHovers) return prev;

            // Create a new set with only the hover states for existing notifications
            const updated = new Set<number>();
            let hasChanges = false;

            prev.forEach((slug) => {
                if (currentSlugs.has(slug)) {
                    updated.add(slug);
                } else {
                    hasChanges = true;
                }
            });

            // Only update state if there were actual changes
            if (!hasChanges) return prev;
            return updated.size > 0 ? updated : new Set<number>();
        });
    }, [data.notifications]);

    const handleDismiss = useCallback(
        (slug: number) => {
            // Remove the notification from hoveredNotifications when dismissed
            setHoveredNotifications((prev) => {
                // If the slug isn't in the set, return previous state
                if (!prev.has(slug)) return prev;

                // Create a new set without the slug
                const newSet = new Set(prev);
                newSet.delete(slug);

                // If the set is empty, return a new empty set to ensure reference changes
                return newSet.size === 0 ? new Set() : newSet;
            });
            // Call the original remove function
            data.remove(slug);
        },
        [data.remove],
    );

    useEffect(() => {
        if (!info) return;
        if (!userAddress || userAddress === '') return;
        const { unsubscribe } = info.subscribe(
            {
                type: WsChannels.NOTIFICATION,
                user: userAddress,
            },
            postNotification,
        );
        return unsubscribe;
    }, [userAddress, info]);

    const postNotification = useCallback((payload: NotificationMsg) => {
        if (!payload || !payload.data) return;
        const notification = payload.data.notification;
        if (backgroundFillNotifRef.current && notification) {
            const title = notification.split(':')[0];
            const message = notification.split(':')[1];
            data.add({
                title: title,
                message: message,
                icon: 'check',
            });
        }
    }, []);

    const version = null;

    // logic to fetch news data asynchronously
    const [news, setNews] = useState<NewsItemIF[]>([]);
    useEffect(() => {
        fetch('/announcements.json', { cache: 'no-store' })
            .then((res) => res.json())
            .then((formatted) => {
                setNews(formatted.news);
            });
        const interval = setInterval(
            () => {
                fetch('/announcements.json', { cache: 'no-store' })
                    .then((res) => res.json())
                    .then((formatted) => {
                        setNews(formatted.news);
                    });
            },
            5 * 60 * 1000,
        );
        return () => clearInterval(interval);
    }, []);

    // logic to prevent a user from seeing a news item repeatedly
    const alreadyViewed = useViewed();

    // apply filter to messages received by the app
    const unseen: {
        messages: {
            headline: string;
            body: string;
        }[];
        hashes: string[];
    } = useMemo(() => {
        // output variable for human-readable messages
        const messages: {
            headline: string;
            body: string;
        }[] = [];
        // output variable for message hashes
        const hashes: string[] = [];
        // iterate over news items, handle ones not previously seen
        news.forEach((n: NewsItemIF) => {
            if (!alreadyViewed.checkIfViewed(n.id)) {
                messages.push({
                    headline: n.headline,
                    body: n.body,
                });
                hashes.push(n.id);
            }
        });
        // return output variables
        return {
            messages,
            hashes,
        };
    }, [
        // recalculate for changes in the base data set
        news,
        // recalculate for changes in the list of viewed messages
        alreadyViewed,
    ]);

    const [userClosedNews, setUserClosedNews] = useState<boolean>(false);

    const { pathname } = useLocation();

    if (pathname === '/') {
        return <></>;
    }

    return (
        <div className={styles.notifications}>
            <AnimatePresence>
                {enableTxNotifications &&
                    data.notifications.map((n: notificationIF) => (
                        <motion.div
                            key={JSON.stringify(n)} // Ensure uniqueness
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{
                                duration: 0.3,
                            }}
                            layout // Optional: enables smooth stacking animations
                        >
                            <Notification
                                key={n.slug}
                                data={n}
                                dismiss={handleDismiss}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                shouldPauseDismissal={
                                    data.notifications.length <= 3 &&
                                    hoveredNotifications.size > 0
                                }
                            />
                        </motion.div>
                    ))}
            </AnimatePresence>
            {showReload && (
                <div className={styles.new_version_available}>
                    <header>
                        <div />
                        <div>🚀</div>
                        <MdClose
                            onClick={() => setShowReload(false)}
                            color='var(--text2)'
                            size={16}
                        />
                    </header>
                    <div className={styles.text_content}>
                        <h3>New Version Available</h3>
                        <p>
                            {version
                                ? `Version ${version} is ready to install with new features and improvements.`
                                : 'A new version is ready with exciting updates and bug fixes.'}
                        </p>
                    </div>
                    <SimpleButton
                        onClick={() => {
                            window.location.reload();
                            setShowReload(false);
                        }}
                    >
                        Update Now
                    </SimpleButton>
                </div>
            )}
            {unseen.messages.length > 0 && !userClosedNews && (
                <div className={styles.news}>
                    <header>
                        <h4>Announcements</h4>
                        <MdClose
                            color='var(--text2)'
                            size={16}
                            onClick={() => {
                                setUserClosedNews(true);
                                alreadyViewed.markAsViewed(unseen.hashes);
                            }}
                        />
                    </header>
                    <ul>
                        {unseen.messages.map(
                            (n: { headline: string; body: string }) => (
                                <li>
                                    <h5>{n.headline}</h5>
                                    <p>{n.body}</p>
                                </li>
                            ),
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
