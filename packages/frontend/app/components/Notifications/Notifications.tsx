import type { NotificationMsg } from '@perps-app/sdk/src/utils/types';
import { AnimatePresence, motion } from 'framer-motion';
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

/** Stack layout constants */
const STACK_ITEM_HEIGHT = 112;
const STACK_COLLAPSED = 10; // vertical overlap
const STACK_GAP = 36; // expanded gap

/** Focus behavior */
const FOCUS_SCALE = 1.02;
const DIMMED_OPACITY = 0.55;

export default function Notifications() {
    // const isTallScreen = useMediaQuery('(min-height: 1080px)');
    const maxVisible = 5;
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
    const [expanded, setExpanded] = useState(false);
    const [focusedSlug, setFocusedSlug] = useState<number | null>(null);

    const handleMouseEnter = useCallback((slug: number) => {
        setHoveredNotifications((prev) => {
            if (prev.has(slug)) return prev;
            const next = new Set(prev);
            next.add(slug);
            return next;
        });
    }, []);

    const handleMouseLeave = useCallback((slug: number) => {
        setHoveredNotifications((prev) => {
            if (!prev.has(slug)) return prev;
            const next = new Set(prev);
            next.delete(slug);
            return next.size === 0 ? new Set() : next;
        });
    }, []);

    // Clean hover states when notifications change
    useEffect(() => {
        const currentSlugs = new Set(data.notifications.map((n) => n.slug));
        setHoveredNotifications((prev) => {
            if (prev.size === 0) return prev;
            const updated = new Set<number>();
            prev.forEach((slug) => currentSlugs.has(slug) && updated.add(slug));
            return updated.size > 0 ? updated : new Set<number>();
        });
        setFocusedSlug((prev) =>
            prev && currentSlugs.has(prev) ? prev : null,
        );
    }, [data.notifications]);

    const handleDismiss = useCallback(
        (slug: number) => {
            setHoveredNotifications((prev) => {
                if (!prev.has(slug)) return prev;
                const next = new Set(prev);
                next.delete(slug);
                return next.size === 0 ? new Set() : next;
            });
            if (focusedSlug === slug) setFocusedSlug(null);
            data.remove(slug);
        },
        [data.remove, focusedSlug],
    );

    useEffect(() => {
        if (!info) return;
        if (!userAddress || userAddress === '') return;
        const { unsubscribe } = info.subscribe(
            { type: WsChannels.NOTIFICATION, user: userAddress },
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
            data.add({ title, message, icon: 'check' });
        }
    }, []);

    const version = null;

    // Fetch announcements
    const [news, setNews] = useState<NewsItemIF[]>([]);
    useEffect(() => {
        const fetchNews = () =>
            fetch('/announcements.json', { cache: 'no-store' })
                .then((res) => res.json())
                .then((formatted) => setNews(formatted.news));
        fetchNews();
        const interval = setInterval(fetchNews, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const alreadyViewed = useViewed();

    const unseen: {
        messages: { headline: string; body: string }[];
        hashes: string[];
    } = useMemo(() => {
        const messages: { headline: string; body: string }[] = [];
        const hashes: string[] = [];
        news.forEach((n) => {
            if (!alreadyViewed.checkIfViewed(n.id)) {
                messages.push({ headline: n.headline, body: n.body });
                hashes.push(n.id);
            }
        });
        return { messages, hashes };
    }, [news, alreadyViewed]);

    const [userClosedNews, setUserClosedNews] = useState<boolean>(false);
    const { pathname } = useLocation();

    // Last N notifications, oldest at index 0
    const visible = useMemo(
        () => data.notifications.slice(-maxVisible),
        [data.notifications, maxVisible],
    );

    const shouldPause =
        expanded ||
        (data.notifications.length <= 3 && hoveredNotifications.size > 0);

    if (pathname === '/') {
        return <></>;
    }

    return (
        <div
            className={styles.notifications}
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => {
                setExpanded(false);
                setFocusedSlug(null);
            }}
            aria-label='Notifications'
        >
            <AnimatePresence initial={false}>
                {enableTxNotifications &&
                    visible.map((n: notificationIF, i: number) => {
                        const count = visible.length;
                        const indexFromTop = i; // 0 = oldest
                        const indexFromBottom = count - 1 - i; // 0 = NEWEST  ✅

                        const isTop = indexFromBottom === 0;

                        const yCollapsed = indexFromTop * STACK_COLLAPSED;
                        const yExpanded =
                            indexFromTop * (STACK_ITEM_HEIGHT + STACK_GAP);

                        const isFocused = expanded && focusedSlug === n.slug;
                        const isDimmed =
                            expanded &&
                            focusedSlug !== null &&
                            focusedSlug !== n.slug;

                        // ensure top card never fades
                        const baseOpacityCollapsed = isTop
                            ? 1
                            : Math.max(0.75, 1 - indexFromTop * 0.1);

                        const targetOpacity = isDimmed
                            ? DIMMED_OPACITY
                            : expanded
                              ? 1
                              : baseOpacityCollapsed;

                        return (
                            <motion.div
                                key={n.slug}
                                className={styles.notificationWrapper}
                                initial={{ opacity: 1, y: 10 }}
                                animate={{
                                    y: -1 * (expanded ? yExpanded : yCollapsed),
                                    opacity: targetOpacity,
                                    scale: isFocused ? FOCUS_SCALE : 1,
                                }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{
                                    y: {
                                        type: 'spring',
                                        stiffness: 380,
                                        damping: 28,
                                        mass: 0.7,
                                    },
                                    opacity: { duration: 0.18 },
                                    scale: { duration: 0.18 },
                                }}
                                layout='position'
                                style={{
                                    position: 'absolute',
                                    right: 0,
                                    bottom: 0,
                                    width: '100%',
                                    zIndex: 1000 + indexFromTop,
                                    minHeight: STACK_ITEM_HEIGHT,
                                    pointerEvents: 'auto',
                                    transformOrigin: 'right bottom',
                                    willChange: 'transform, opacity',
                                }}
                                onMouseEnter={() => {
                                    if (expanded) setFocusedSlug(n.slug);
                                }}
                                onMouseLeave={() => {
                                    if (focusedSlug === n.slug)
                                        setFocusedSlug(null);
                                }}
                            >
                                <Notification
                                    key={n.slug}
                                    data={n}
                                    dismiss={handleDismiss}
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                    shouldPauseDismissal={shouldPause}
                                    staggerIndex={indexFromTop}
                                />
                            </motion.div>
                        );
                    })}
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
                        {unseen.messages.map((n) => (
                            <li key={n.headline}>
                                <h5>{n.headline}</h5>
                                <p>{n.body}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
