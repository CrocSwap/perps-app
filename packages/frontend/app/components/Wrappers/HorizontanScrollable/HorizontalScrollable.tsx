import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './HorizontalScrollable.module.css';
import { motion } from 'framer-motion';
import { t } from 'i18next';

interface HorizontalScrollableProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: string;
    wrapperId?: string;
    excludes?: string[];
    offset?: number;
    autoScroll?: boolean;
    autoScrollSpeed?: number;
    autoScrollDelay?: number;
}

export function HorizontalScrollable(props: HorizontalScrollableProps) {
    const {
        children,
        className,
        maxWidth,
        wrapperId,
        excludes,
        offset,
        autoScroll = false,
        autoScrollSpeed = 30,
        autoScrollDelay = 2000,
    } = props;

    const wrapperRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<HTMLDivElement>(null);

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isAutoScrolling, setIsAutoScrolling] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isUserControlled, setIsUserControlled] = useState(false);

    // Detect mobile device
    const detectMobile = useCallback(() => {
        const userAgent =
            navigator.userAgent || navigator.vendor || (window as any).opera;
        const mobileRegex =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        const isTouchDevice =
            'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;

        return mobileRegex.test(userAgent) || (isTouchDevice && isSmallScreen);
    }, []);

    const startAutoScroll = useCallback(() => {
        if (
            !autoScroll ||
            !isMobile ||
            !animationRef.current ||
            isUserControlled
        )
            return;

        setIsAutoScrolling(true);
        setIsPaused(false);

        // Apply CSS animation
        animationRef.current.style.animationDuration = `${autoScrollSpeed}s`;
        animationRef.current.style.animationPlayState = 'running';
    }, [autoScroll, isMobile, autoScrollSpeed, isUserControlled]);

    const pauseAutoScroll = useCallback(() => {
        if (!autoScroll || !isMobile || !animationRef.current) return;

        setIsPaused(true);
        setIsAutoScrolling(false);
        animationRef.current.style.animationPlayState = 'paused';
    }, [autoScroll, isMobile]);

    const handleClick = useCallback(
        (e: Event) => {
            e.stopPropagation();
            if (!autoScroll || !isMobile) return;

            // Stop auto-scroll when clicking inside
            setIsUserControlled(true);
            pauseAutoScroll();
        },
        [autoScroll, isMobile, pauseAutoScroll],
    );

    const handleOutsideClick = useCallback(
        (e: Event) => {
            if (!autoScroll || !isMobile || !wrapperRef.current) return;

            // Check if click is outside the component
            if (!wrapperRef.current.contains(e.target as Node)) {
                setIsUserControlled(false);
                // Small delay before resuming
                setTimeout(() => {
                    if (!isUserControlled) {
                        startAutoScroll();
                    }
                }, 100);
            }
        },
        [autoScroll, isMobile, startAutoScroll, isUserControlled],
    );

    const handleNonClickInteraction = useCallback(() => {
        if (!autoScroll || !isMobile) return;

        // For non-click interactions (hover, touch, scroll), pause temporarily
        pauseAutoScroll();

        // Resume
        setTimeout(() => {
            if (!isUserControlled && animationRef.current) {
                setIsPaused(false);
                animationRef.current.style.animationPlayState = 'running';
            }
        }, autoScrollDelay);
    }, [
        autoScroll,
        isMobile,
        pauseAutoScroll,
        autoScrollDelay,
        isUserControlled,
    ]);

    const calculateMaxWidth = useCallback(() => {
        if (wrapperId && excludes && excludes.length > 0) {
            const wrapper = document.getElementById(wrapperId);
            if (wrapper) {
                const wrapperWidth = wrapper.getBoundingClientRect().width;
                let excludeSum = 0;

                excludes.forEach((exclude) => {
                    const excludeElement = document.getElementById(exclude);
                    if (excludeElement) {
                        excludeSum += parseFloat(
                            excludeElement
                                .getBoundingClientRect()
                                .width.toString(),
                        );
                    }
                });
                const maxWidth = wrapperWidth - excludeSum - (offset || 0);
                if (maxWidth && wrapperRef.current) {
                    wrapperRef.current.style.maxWidth = `${maxWidth}px`;
                }
            }
        }
    }, [wrapperId, excludes, offset]);

    useEffect(() => {
        setIsMobile(detectMobile());

        const handleResize = () => {
            setIsMobile(detectMobile());
            calculateMaxWidth();
        };

        if (wrapperId && excludes && excludes.length > 0) {
            calculateMaxWidth();
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [calculateMaxWidth, detectMobile]);

    // Initialize auto-scroll for mobile
    useEffect(() => {
        if (autoScroll && isMobile && !isUserControlled) {
            setTimeout(() => {
                startAutoScroll();
            }, 500); // delay for dom to load
        }

        return () => {
            if (animationRef.current) {
                animationRef.current.style.animationPlayState = 'paused';
            }
        };
    }, [autoScroll, isMobile, startAutoScroll, isUserControlled]);

    //  for outside clicks
    useEffect(() => {
        if (autoScroll && isMobile) {
            document.addEventListener('click', handleOutsideClick);
            return () => {
                document.removeEventListener('click', handleOutsideClick);
            };
        }
    }, [autoScroll, isMobile, handleOutsideClick]);

    const checkScroll = () => {
        if (wrapperRef.current && !isAutoScrolling) {
            const { scrollLeft, scrollWidth, clientWidth } = wrapperRef.current;

            // Can scroll left if we're not at the beginning
            setCanScrollLeft(scrollLeft > 1);

            // Can scroll right if we're not at the end
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
        }
    };

    const scrollLeft = () => {
        handleNonClickInteraction();
        setCanScrollLeft(false);
        setCanScrollRight(false);

        if (wrapperRef.current) {
            const { clientWidth } = wrapperRef.current;
            wrapperRef.current.scrollBy({
                left: -clientWidth / 2,
                behavior: 'smooth',
            });

            setTimeout(() => {
                checkScroll();
            }, 350);
        }
    };

    const scrollRight = () => {
        handleNonClickInteraction();
        setCanScrollLeft(false);
        setCanScrollRight(false);
        if (wrapperRef.current) {
            const { clientWidth } = wrapperRef.current;
            wrapperRef.current.scrollBy({
                left: clientWidth / 2,
                behavior: 'smooth',
            });

            setTimeout(() => {
                checkScroll();
            }, 350);
        }
    };

    const scrollLeftBtn = useCallback(() => {
        // Hide scroll buttons on mobile when auto-scrolling is enabled
        if (isMobile && autoScroll) return null;

        if (canScrollLeft) {
            return (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <button
                        className={`${styles.scrollArrow} ${styles.scrollArrowLeft}`}
                        onClick={scrollLeft}
                        aria-label={t('aria.scrollTabsLeft')}
                    >
                        <svg viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z' />
                        </svg>
                    </button>
                </motion.div>
            );
        }
        return null;
    }, [canScrollLeft, isMobile, autoScroll]);

    const scrollRightBtn = useCallback(() => {
        // Hide scroll buttons on mobile when auto-scrolling is enabled
        if (isMobile && autoScroll) return null;

        if (canScrollRight) {
            return (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <button
                        className={`${styles.scrollArrow} ${styles.scrollArrowRight}`}
                        onClick={scrollRight}
                        aria-label={t('aria.scrollTabsRight')}
                    >
                        <svg viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z' />
                        </svg>
                    </button>
                </motion.div>
            );
        }
        return null;
    }, [canScrollRight, isMobile, autoScroll]);
    // functionality to stop scrolling on user's interaction

    useEffect(() => {
        checkScroll();

        const handleResize = () => {
            checkScroll();
        };

        const handleScroll = () => {
            checkScroll();
            if (autoScroll && isMobile) {
                handleNonClickInteraction();
            }
        };

        const handleNonClickEvents = () => {
            if (autoScroll && isMobile) {
                handleNonClickInteraction();
            }
        };

        const handleClickEvent = (e: Event) => {
            if (autoScroll && isMobile) {
                handleClick(e);
            }
        };

        window.addEventListener('resize', handleResize);

        if (wrapperRef.current) {
            wrapperRef.current.addEventListener('scroll', handleScroll);
            wrapperRef.current.addEventListener(
                'touchstart',
                handleNonClickEvents,
            );
            wrapperRef.current.addEventListener(
                'touchmove',
                handleNonClickEvents,
            );
            wrapperRef.current.addEventListener(
                'mousedown',
                handleNonClickEvents,
            );
            wrapperRef.current.addEventListener(
                'mouseenter',
                handleNonClickEvents,
            );
            wrapperRef.current.addEventListener('click', handleClickEvent);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (wrapperRef.current) {
                wrapperRef.current.removeEventListener('scroll', handleScroll);
                wrapperRef.current.removeEventListener(
                    'touchstart',
                    handleNonClickEvents,
                );
                wrapperRef.current.removeEventListener(
                    'touchmove',
                    handleNonClickEvents,
                );
                wrapperRef.current.removeEventListener(
                    'mousedown',
                    handleNonClickEvents,
                );
                wrapperRef.current.removeEventListener(
                    'mouseenter',
                    handleNonClickEvents,
                );
                wrapperRef.current.removeEventListener(
                    'click',
                    handleClickEvent,
                );
            }
        };
    }, [autoScroll, isMobile, handleNonClickInteraction, handleClick]);

    useEffect(() => {
        checkScroll();
    }, [children]);

    // Clone children for infinite scroll effect
    const renderContent = () => {
        if (autoScroll && isMobile) {
            return (
                <>
                    {children}
                    {children} {/* Duplicate content for seamless loop */}
                </>
            );
        }
        return children;
    };

    return (
        <>
            <div style={{ position: 'relative' }}>
                <div className={styles.scrollButtonsWrapper}>
                    {scrollLeftBtn()}
                    {scrollRightBtn()}
                </div>
                <div
                    ref={wrapperRef}
                    className={`${styles.horizontalScrollable} ${className} ${
                        isMobile && autoScroll && isAutoScrolling
                            ? styles.autoScrolling
                            : ''
                    }`}
                    style={{ ...(maxWidth && { maxWidth }) }}
                >
                    <div
                        className={`${styles.horizontalScrollableContent} ${
                            isMobile && autoScroll && isAutoScrolling
                                ? styles.animatedContent
                                : ''
                        }`}
                        ref={animationRef}
                    >
                        {renderContent()}
                    </div>
                </div>
            </div>
        </>
    );
}
