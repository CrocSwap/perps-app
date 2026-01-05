import {
    Children,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type PropsWithChildren,
    type ReactNode,
} from 'react';
import styles from './RotatingList.module.css';

export interface RotatingListProps {
    items?: ReactNode[];
    intervalMs?: number;
    pauseOnHover?: boolean;
    className?: string;
}

const TRANSITION_MS = 600;

export function RotatingList({
    items = [],
    intervalMs = 3500,
    pauseOnHover = true,
    className = '',
    children,
}: PropsWithChildren<RotatingListProps>) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [nextIndex, setNextIndex] = useState<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isPausedRef = useRef(false);
    const activeIndexRef = useRef(0);
    const nextIndexRef = useRef<number | null>(null);

    const composedItems = useMemo<ReactNode[]>(() => {
        if (items.length > 0) return items;
        const collected = Children.toArray(children);
        return collected.length > 0 ? collected : ['—'];
    }, [children, items]);

    const safeItems = composedItems;
    const hasMultipleItems = safeItems.length > 1;

    useEffect(() => {
        activeIndexRef.current = activeIndex;
    }, [activeIndex]);

    useEffect(() => {
        nextIndexRef.current = nextIndex;
    }, [nextIndex]);

    useEffect(() => {
        setActiveIndex((prev) => (prev >= safeItems.length ? 0 : prev));
    }, [safeItems.length]);

    useEffect(() => {
        if (!hasMultipleItems) return;

        const clearTimer = () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };

        const startTimer = () => {
            clearTimer();
            timerRef.current = setInterval(() => {
                if (isPausedRef.current) return;
                if (nextIndexRef.current !== null) return;
                setNextIndex((prev) => {
                    if (prev !== null) return prev;
                    return (activeIndexRef.current + 1) % safeItems.length;
                });
            }, intervalMs);
        };

        startTimer();
        return () => clearTimer();
    }, [intervalMs, hasMultipleItems, safeItems.length]);

    useEffect(() => {
        if (nextIndex === null) return;
        const timeout = setTimeout(() => {
            setActiveIndex(nextIndex);
            setNextIndex(null);
        }, TRANSITION_MS);
        return () => clearTimeout(timeout);
    }, [nextIndex]);

    const handleMouseEnter = () => {
        if (pauseOnHover) {
            isPausedRef.current = true;
        }
    };

    const handleMouseLeave = () => {
        if (pauseOnHover) {
            isPausedRef.current = false;
        }
    };

    const containerStyle: CSSProperties = useMemo(
        () => ({ '--transition-ms': `${TRANSITION_MS}ms` }) as CSSProperties,
        [],
    );

    return (
        <div
            className={[styles.wheel, className].filter(Boolean).join(' ')}
            style={containerStyle}
            aria-live='polite'
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className={styles.stage}>
                <span
                    key={`active-${activeIndex}`}
                    className={[
                        styles.item,
                        nextIndex !== null
                            ? styles.itemLeaving
                            : styles.itemVisible,
                    ].join(' ')}
                >
                    {safeItems[activeIndex]}
                </span>
                {nextIndex !== null && (
                    <span
                        key={`next-${nextIndex}`}
                        className={[styles.item, styles.itemEntering].join(' ')}
                    >
                        {safeItems[nextIndex]}
                    </span>
                )}
            </div>
        </div>
    );
}
