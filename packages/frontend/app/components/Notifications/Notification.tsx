import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ImSpinner8 } from 'react-icons/im';
import {
    IoAlertCircleOutline,
    IoCheckmarkCircleOutline,
    IoClose,
} from 'react-icons/io5';
import { useAppSettings } from '~/stores/AppSettingsStore';
import type { notificationIF } from '~/stores/NotificationStore';
import styles from './Notification.module.css';
import { t } from 'i18next';

interface propsIF {
    data: notificationIF;
    dismiss: (id: number) => void;
    onMouseEnter?: (slug: number) => void;
    onMouseLeave?: (slug: number) => void;
    shouldPauseDismissal?: boolean;
}

export default function Notification(props: propsIF) {
    const {
        data,
        dismiss,
        onMouseEnter,
        onMouseLeave,
        shouldPauseDismissal = false,
    } = props;
    // create and memoize the UNIX time when this element was mounted
    const createdAt = useRef<number>(Date.now());

    const { getBsColor } = useAppSettings();

    // time period (ms) after which to auto-dismiss the notification
    const DISMISS_AFTER = data.removeAfter || 5000;

    // logic to remove this elem from the DOM after a timeout, yes the
    const [isHovered, setIsHovered] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>(null);

    // Track if we're in the middle of a debounce
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [isDebouncedHovered, setIsDebouncedHovered] = useState(false);

    // Debounce hover state changes
    useEffect(() => {
        // Store the current debounce timer ref to avoid race conditions
        let currentTimer = debounceTimerRef.current;

        if (isHovered || shouldPauseDismissal) {
            // Clear any pending debounce timer when hovering starts
            if (currentTimer) {
                clearTimeout(currentTimer);
                debounceTimerRef.current = null;
            }
            setIsDebouncedHovered(true);
        } else {
            // Set a timer to update hover state after debounce period
            currentTimer = setTimeout(() => {
                // Only update state if the timer hasn't been cleared
                if (debounceTimerRef.current === currentTimer) {
                    setIsDebouncedHovered(false);
                    debounceTimerRef.current = null;
                }
            }, 500); // 500ms debounce

            // Store the new timer reference
            debounceTimerRef.current = currentTimer;
        }

        // Cleanup function to clear the current timer on unmount or when dependencies change
        return () => {
            if (currentTimer) {
                clearTimeout(currentTimer);
                // Only clear the ref if it still points to the current timer
                if (debounceTimerRef.current === currentTimer) {
                    debounceTimerRef.current = null;
                }
            }
        };
    }, [isHovered, shouldPauseDismissal]);

    // Setup auto-dismiss timer, but only when not hovered and not in group hover state
    useEffect(() => {
        // Clear any existing timeout when dependencies change
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Only set new timeout if not hovered
        if (!isDebouncedHovered) {
            const timeElapsed = Date.now() - createdAt.current;
            const timeRemaining = Math.max(0, DISMISS_AFTER - timeElapsed);

            // Only set timeout if there's time remaining
            if (timeRemaining > 0) {
                timeoutRef.current = setTimeout(() => {
                    dismiss(data.slug);
                }, timeRemaining);
            } else {
                // If time has already elapsed, dismiss immediately
                dismiss(data.slug);
            }
        }

        // Cleanup function to clear timeout on unmount or when dependencies change
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [dismiss, isDebouncedHovered, data.slug, DISMISS_AFTER]); // Added DISMISS_AFTER to dependencies

    // px size at which to render SVG icons
    const ICON_SIZE = 24;

    // logic to add green syntax highlighting to Bought notifications
    function formatMessage(message: string): ReactNode {
        if (!message) return;
        const fixedMessage: string = message.trim();
        if (fixedMessage.startsWith('Bought')) {
            const firstSpace = fixedMessage.indexOf(' ');
            const secondSpace = fixedMessage.indexOf(' ', firstSpace + 1);
            const thirdSpace = fixedMessage.indexOf(' ', secondSpace + 1);

            if (thirdSpace !== -1) {
                const firstPart = fixedMessage.substring(0, thirdSpace);
                const secondPart = fixedMessage.substring(thirdSpace);

                return (
                    <>
                        <span style={{ color: getBsColor().buy }}>
                            {firstPart}
                        </span>
                        {secondPart}
                    </>
                );
            }
        } else if (fixedMessage.startsWith('Sold')) {
            const firstSpace = fixedMessage.indexOf(' ');
            const secondSpace = fixedMessage.indexOf(' ', firstSpace + 1);
            const thirdSpace = fixedMessage.indexOf(' ', secondSpace + 1);

            if (thirdSpace !== -1) {
                const firstPart = fixedMessage.substring(0, thirdSpace);
                const secondPart = fixedMessage.substring(thirdSpace);

                return (
                    <>
                        <span style={{ color: getBsColor().sell }}>
                            {firstPart}
                        </span>
                        {secondPart}
                    </>
                );
            }
        }
        return fixedMessage;
    }

    return (
        <section
            className={`${styles.notification} ${
                data.txLink && data.message.length > 50
                    ? styles.tallNotification
                    : ''
            }`}
            onMouseEnter={() => {
                setIsHovered(true);
                onMouseEnter?.(data.slug);
            }}
            onMouseLeave={() => {
                setIsHovered(false);
                onMouseLeave?.(data.slug);
            }}
        >
            <header>
                <div className={styles.header_content}>
                    {data.icon === 'spinner' && (
                        <div className={styles.rotate}>
                            <ImSpinner8
                                size={ICON_SIZE}
                                color='var(--accent1)'
                            />
                        </div>
                    )}
                    {data.icon === 'check' && (
                        <IoCheckmarkCircleOutline
                            size={ICON_SIZE}
                            color='var(--accent1)'
                        />
                    )}
                    {data.icon === 'error' && (
                        <IoAlertCircleOutline
                            size={ICON_SIZE}
                            color='var(--red)'
                        />
                    )}
                    <h2
                        style={{ userSelect: 'text' }}
                        className={
                            data.title.length > 25 ? styles.smallTitle : ''
                        }
                    >
                        {data.title}
                    </h2>
                </div>
                <IoClose
                    className={styles.close}
                    size={ICON_SIZE}
                    onClick={() => dismiss(data.slug)}
                />
            </header>
            <p style={{ userSelect: 'text' }}>{formatMessage(data.message)}</p>
            {data.txLink && (
                <a
                    href={data.txLink}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={styles.txLink}
                    onClick={() => {
                        if (typeof plausible === 'function') {
                            plausible('External Link Clicked', {
                                props: {
                                    location: 'notification',
                                    linkType:
                                        'block explorer link from notification',
                                    url: data.txLink,
                                },
                            });
                        }
                    }}
                >
                    {t('transactions.viewOnExplorer')}
                </a>
            )}
        </section>
    );
}
