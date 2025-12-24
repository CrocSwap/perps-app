import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import styles from './Tooltip.module.css';

type TooltipPosition =
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';

interface TooltipProps {
    children: ReactNode;
    content: ReactNode;
    position?: TooltipPosition;
    className?: string;
    disabled?: boolean;
    delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
    children,
    content,
    position = 'top',
    className = '',
    disabled = false,
    delay = 0,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isPositioned, setIsPositioned] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>(null);
    const positionTimeoutRef = useRef<NodeJS.Timeout>(null);
    const isMobile = useRef(false);

    // Detect if device is mobile
    useEffect(() => {
        isMobile.current = 'ontouchstart' in window;
    }, []);

    const positionTooltip = () => {
        if (!triggerRef.current || !tooltipRef.current || !isVisible) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const padding = 10;
        const gap = 8;

        // If tooltip hasn't been measured yet , try again
        if (tooltipRect.width === 0 || tooltipRect.height === 0) {
            if (positionTimeoutRef.current) {
                clearTimeout(positionTimeoutRef.current);
            }
            positionTimeoutRef.current = setTimeout(
                () => positionTooltip(),
                10,
            );
            return;
        }

        let left = 0;
        let top = 0;

        // Calculate position based on the position prop
        switch (position) {
            case 'top':
                left =
                    triggerRect.left +
                    triggerRect.width / 2 -
                    tooltipRect.width / 2;
                top = triggerRect.top - tooltipRect.height - gap;
                break;

            case 'bottom':
                left =
                    triggerRect.left +
                    triggerRect.width / 2 -
                    tooltipRect.width / 2;
                top = triggerRect.bottom + gap;
                break;

            case 'left':
                left = triggerRect.left - tooltipRect.width - gap;
                top =
                    triggerRect.top +
                    triggerRect.height / 2 -
                    tooltipRect.height / 2;
                break;

            case 'right':
                left = triggerRect.right + gap;
                top =
                    triggerRect.top +
                    triggerRect.height / 2 -
                    tooltipRect.height / 2;
                break;

            case 'top-left':
                left = triggerRect.left;
                top = triggerRect.top - tooltipRect.height - gap;
                break;

            case 'top-right':
                left = triggerRect.right - tooltipRect.width;
                top = triggerRect.top - tooltipRect.height - gap;
                break;

            case 'bottom-left':
                left = triggerRect.left;
                top = triggerRect.bottom + gap;
                break;

            case 'bottom-right':
                left = triggerRect.right - tooltipRect.width;
                top = triggerRect.bottom + gap;
                break;
        }

        // Fallback positioning if tooltip would go off-screen
        let finalPosition = position;

        // Check horizontal bounds
        if (left < padding) {
            if (position.includes('left')) {
                // Try right variant
                if (position === 'left') {
                    left = triggerRect.right + gap;
                    finalPosition = 'right';
                } else if (position === 'top-left') {
                    left = triggerRect.right - tooltipRect.width;
                    finalPosition = 'top-right';
                } else if (position === 'bottom-left') {
                    left = triggerRect.right - tooltipRect.width;
                    finalPosition = 'bottom-right';
                }
            } else {
                left = padding;
            }
        } else if (left + tooltipRect.width > window.innerWidth - padding) {
            if (position.includes('right')) {
                // Try left variant
                if (position === 'right') {
                    left = triggerRect.left - tooltipRect.width - gap;
                    finalPosition = 'left';
                } else if (position === 'top-right') {
                    left = triggerRect.left;
                    finalPosition = 'top-left';
                } else if (position === 'bottom-right') {
                    left = triggerRect.left;
                    finalPosition = 'bottom-left';
                }
            } else {
                left = window.innerWidth - tooltipRect.width - padding;
            }
        }

        // Check vertical bounds
        if (top < padding) {
            if (position.includes('top')) {
                // Try bottom variant
                if (position === 'top') {
                    top = triggerRect.bottom + gap;
                    finalPosition = 'bottom';
                } else if (position === 'top-left') {
                    top = triggerRect.bottom + gap;
                    finalPosition =
                        finalPosition === 'top-right'
                            ? 'bottom-right'
                            : 'bottom-left';
                } else if (position === 'top-right') {
                    top = triggerRect.bottom + gap;
                    finalPosition =
                        finalPosition === 'top-left'
                            ? 'bottom-left'
                            : 'bottom-right';
                }
            } else {
                top = padding;
            }
        } else if (top + tooltipRect.height > window.innerHeight - padding) {
            if (position.includes('bottom')) {
                // Try top variant
                if (position === 'bottom') {
                    top = triggerRect.top - tooltipRect.height - gap;
                    finalPosition = 'top';
                } else if (position === 'bottom-left') {
                    top = triggerRect.top - tooltipRect.height - gap;
                    finalPosition =
                        finalPosition === 'bottom-right'
                            ? 'top-right'
                            : 'top-left';
                } else if (position === 'bottom-right') {
                    top = triggerRect.top - tooltipRect.height - gap;
                    finalPosition =
                        finalPosition === 'bottom-left'
                            ? 'top-left'
                            : 'top-right';
                }
            } else {
                top = window.innerHeight - tooltipRect.height - padding;
            }
        }

        setTooltipPosition({
            left: Math.max(0, Math.round(left)),
            top: Math.max(0, Math.round(top)),
        });

        // Mark as positioned so it becomes visible
        setIsPositioned(true);
    };

    const showTooltip = () => {
        if (disabled || !content) return;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (delay > 0) {
            timeoutRef.current = setTimeout(() => {
                setIsVisible(true);
            }, delay);
        } else {
            setIsVisible(true);
        }
    };

    const hideTooltip = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (positionTimeoutRef.current) {
            clearTimeout(positionTimeoutRef.current);
        }
        setIsVisible(false);
        setIsPositioned(false);
    };

    // Position tooltip when it becomes visible
    useEffect(() => {
        if (isVisible) {
            // Use requestAnimationFrame to ensure DOM has been updated
            const frame = requestAnimationFrame(() => {
                positionTooltip();
            });
            return () => cancelAnimationFrame(frame);
        }
    }, [isVisible]);

    const handleMouseEnter = () => {
        if (!isMobile.current) {
            showTooltip();
        }
    };

    const handleMouseLeave = () => {
        if (!isMobile.current) {
            hideTooltip();
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        e.preventDefault();
        if (isMobile.current) {
            showTooltip();
            // Auto-hide after 3 seconds on mobile
            setTimeout(hideTooltip, 3000);
        }
    };

    // Reposition on scroll or resize
    useEffect(() => {
        if (!isVisible) return;

        const handleScrollOrResize = () => {
            positionTooltip();
        };

        window.addEventListener('scroll', handleScrollOrResize, {
            passive: true,
        });
        window.addEventListener('resize', handleScrollOrResize);

        return () => {
            window.removeEventListener('scroll', handleScrollOrResize);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isVisible, position]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (positionTimeoutRef.current) {
                clearTimeout(positionTimeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            <div
                ref={triggerRef}
                className={`${styles.tooltipWrapper} ${className}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onFocus={() => handleMouseEnter()}
                onBlur={() => handleMouseLeave()}
            >
                {children}
            </div>

            {/* Render tooltip using portal-like approach with fixed positioning */}
            {isVisible && content && (
                <div
                    ref={tooltipRef}
                    className={`${styles.tooltip} ${isPositioned ? styles.visible : styles.positioning} ${
                        isMobile.current ? styles.mobileTooltip : ''
                    }`}
                    style={{
                        left: tooltipPosition.left,
                        top: tooltipPosition.top,
                    }}
                >
                    {content}
                </div>
            )}
        </>
    );
};

export default Tooltip;
