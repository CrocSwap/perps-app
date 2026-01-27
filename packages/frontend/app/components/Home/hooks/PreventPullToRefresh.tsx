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

    // Core protective styles to keep horizontal pans + contain overscroll
    const protectiveStyle = useMemo<React.CSSProperties>(
        () => ({
            touchAction: 'pan-x',
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

            // Only consider pull-to-refresh when root scroller is at top
            const rootScrollTop =
                (document.scrollingElement?.scrollTop ?? window.scrollY) || 0;
            const atTop = rootScrollTop <= 0;

            // Prevent ONLY the downward vertical pull at top (PTR gesture)
            if (verticalIntent && atTop && dy > 0) {
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
