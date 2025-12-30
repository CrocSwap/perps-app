// PreventPullToRefresh.tsx
import React, { useEffect, useMemo, useRef } from 'react';

type Props = {
    /** Enable/disable behavior (helpful for debugging or per-page control) */
    enabled?: boolean;
    /** Optional className for the wrapper */
    className?: string;
    /** Optional inline styles merged with the protective styles */
    style?: React.CSSProperties;
    children: React.ReactNode;
};

const PreventPullToRefresh: React.FC<Props> = ({
    enabled = true,
    className,
    style,
    children,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const startX = useRef(0);

    // Core protective styles to allow vertical pans + contain overscroll
    const protectiveStyle = useMemo<React.CSSProperties>(
        () => ({
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
        }),
        [],
    );

    useEffect(() => {
        if (!enabled) return;
        if (typeof window === 'undefined') return; // SSR safety

        // Harden Android/Chrome globally while mounted
        const html = document.documentElement;
        const body = document.body;

        const prevHtmlOBY = html.style.overscrollBehaviorY;
        const prevBodyOBY = body.style.overscrollBehaviorY;

        html.style.overscrollBehaviorY = 'contain';
        body.style.overscrollBehaviorY = 'contain';

        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length !== 1) return;
            startY.current = e.touches[0].clientY;
            startX.current = e.touches[0].clientX;
        };

        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length !== 1) return;

            const dy = e.touches[0].clientY - startY.current;
            const dx = e.touches[0].clientX - startX.current;

            // vertical intent if vertical delta dominates
            const verticalIntent = Math.abs(dy) > Math.abs(dx);

            // If not a vertical gesture, don't interfere
            if (!verticalIntent) return;

            // Only prevent pull-to-refresh if pulling down (dy > 0)
            if (dy <= 0) return; // scrolling up, allow it

            // Find the scrollable element that contains the touch target
            let target = e.target as HTMLElement;
            let scrollableElement: HTMLElement | null = null;

            // Walk up the DOM to find a scrollable ancestor
            while (target && target !== document.body) {
                const overflowY = window.getComputedStyle(target).overflowY;
                if (
                    (overflowY === 'auto' || overflowY === 'scroll') &&
                    target.scrollHeight > target.clientHeight
                ) {
                    scrollableElement = target;
                    break;
                }
                target = target.parentElement!;
            }

            // Check if we're at the top of the scrollable element
            const scrollTop = scrollableElement?.scrollTop ?? 0;
            const atTop = scrollTop <= 0;

            // Prevent ONLY the downward pull at top (PTR gesture)
            if (atTop) {
                e.preventDefault(); // requires passive:false on the listener
            }
        };

        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: false });

        return () => {
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            html.style.overscrollBehaviorY = prevHtmlOBY;
            body.style.overscrollBehaviorY = prevBodyOBY;
        };
    }, [enabled]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ ...protectiveStyle, ...style }}
        >
            {children}
        </div>
    );
};

export default PreventPullToRefresh;
