import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { MdClose } from 'react-icons/md';
import { useMobile } from '~/hooks/useMediaQuery';
import styles from './Modal.module.css';

type positions = 'center' | 'bottomRight' | 'bottomSheet';

interface ModalProps {
    close?: () => void;
    position?: positions;
    children: ReactNode;
    mobileBreakpoint?: number;
    forceBottomSheet?: boolean;
    title: string;
}

function Modal(props: ModalProps) {
    const {
        close,
        position = 'center',
        children,
        mobileBreakpoint = 768,
        forceBottomSheet = false,
        title,
    } = props;

    const isMobile = useMobile(mobileBreakpoint);

    const [animation, setAnimation] = useState('');
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const bottomSheetRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // State to track drag
    const dragState = useRef({
        startY: 0,
        currentY: 0,
        isDragging: false,
    });

    const shouldUseBottomSheet = forceBottomSheet || isMobile;
    const actualPosition = shouldUseBottomSheet ? 'bottomSheet' : position;

    const OUTSIDE_MODAL_DOM_ID = 'outside_modal';

    // Memoize the close handler
    const handleClose = useCallback((): void => {
        if (actualPosition === 'bottomSheet') {
            setAnimation(styles.slideDown);
            setTimeout(() => {
                if (close) close();
            }, 300);
        } else {
            if (close) close();
        }
    }, [actualPosition, close]);

    // return children without curtain if no close handler
    if (!close) return children;

    // Use requestAnimationFrame for smooth drag updates
    const updateDragPosition = useCallback((deltaY: number) => {
        if (!bottomSheetRef.current) return;
        requestAnimationFrame(() => {
            if (bottomSheetRef.current) {
                bottomSheetRef.current.style.transform = `translateY(${deltaY}px)`;
                bottomSheetRef.current.style.transition = 'none';
            }
        });
    }, []);

    const startDragging = useCallback((clientY: number) => {
        dragState.current = { startY: clientY, currentY: 0, isDragging: true };
        if (handleRef.current) {
            handleRef.current.classList.add(styles.dragging);
        }
    }, []);

    const handleDragStart = useCallback(
        (e: React.TouchEvent | React.MouseEvent): void => {
            if (!bottomSheetRef.current) return;

            if (
                isKeyboardVisible &&
                document.activeElement instanceof HTMLElement
            ) {
                document.activeElement.blur();
                setTimeout(() => setIsKeyboardVisible(false), 50);
            }

            let clientY: number;
            if ('touches' in e) {
                clientY = e.touches[0].clientY;
            } else {
                clientY = (e as React.MouseEvent).clientY;
                document.addEventListener(
                    'mousemove',
                    handleDragMove as unknown as EventListener,
                );
                document.addEventListener(
                    'mouseup',
                    handleDragEnd as unknown as EventListener,
                );
            }

            startDragging(clientY);
        },
        [startDragging, isKeyboardVisible],
    );

    const handleDragMove = useCallback(
        (e: React.TouchEvent | MouseEvent): void => {
            if (!dragState.current.isDragging || !bottomSheetRef.current)
                return;
            let clientY: number;
            if ('touches' in e) clientY = e.touches[0].clientY;
            else clientY = (e as MouseEvent).clientY;

            const deltaY = clientY - dragState.current.startY;
            if (deltaY < 0) return;

            dragState.current.currentY = deltaY;
            updateDragPosition(deltaY);
        },
        [updateDragPosition],
    );

    const handleDragEnd = useCallback((): void => {
        if (!dragState.current.isDragging || !bottomSheetRef.current) return;

        document.removeEventListener(
            'mousemove',
            handleDragMove as unknown as EventListener,
        );
        document.removeEventListener(
            'mouseup',
            handleDragEnd as unknown as EventListener,
        );

        bottomSheetRef.current.style.transition = 'transform 0.3s ease-out';
        const sheetHeight = bottomSheetRef.current.offsetHeight;
        if (dragState.current.currentY > sheetHeight * 0.3) {
            handleClose();
        } else {
            bottomSheetRef.current.style.transform = 'translateY(0)';
        }

        dragState.current.isDragging = false;
        if (handleRef.current) {
            handleRef.current.classList.remove(styles.dragging);
        }
    }, [handleClose, handleDragMove]);

    // Keyboard detection effect
    useEffect(() => {
        const detectKeyboard = () => {
            if (window.visualViewport) {
                const handler = () => {
                    const keyboardVisible =
                        window.visualViewport!.height < window.innerHeight;
                    if (keyboardVisible !== isKeyboardVisible) {
                        setIsKeyboardVisible(keyboardVisible);
                        if (keyboardVisible && document.activeElement) {
                            setTimeout(() => {
                                (
                                    document.activeElement as HTMLElement
                                ).scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'center',
                                });
                            }, 100);
                        }
                    }
                };
                window.visualViewport.addEventListener('resize', handler);
                return () =>
                    window.visualViewport!.removeEventListener(
                        'resize',
                        handler,
                    );
            }
            return undefined;
        };
        return detectKeyboard();
    }, [isKeyboardVisible]);

    // Prevent background scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const preventDefaultTouchMove = (e: TouchEvent) => {
            if (modalRef.current?.contains(e.target as Node)) {
                e.preventDefault();
            }
        };
        document.addEventListener('touchmove', preventDefaultTouchMove, {
            passive: false,
        });
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('touchmove', preventDefaultTouchMove);
        };
    }, []);

    // Escape key close
    useEffect(() => {
        let animationTimeout: number;
        const handleEscape = (evt: KeyboardEvent): void => {
            if (evt.key === 'Escape' && close) {
                if (
                    isKeyboardVisible &&
                    document.activeElement instanceof HTMLElement
                ) {
                    document.activeElement.blur();
                    return;
                }
                handleClose();
            }
        };
        if (actualPosition === 'bottomSheet') {
            animationTimeout = window.setTimeout(
                () => setAnimation(styles.slideUp),
                10,
            );
        }
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('keydown', handleEscape);
            if (animationTimeout) window.clearTimeout(animationTimeout);
        };
    }, [actualPosition, close, handleClose, isKeyboardVisible]);

    const pointerDownOnBackdrop = useRef(false);
    const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
    const MOVE_TOLERANCE = 6;
    function distance(
        a: { x: number; y: number },
        b: { x: number; y: number },
    ) {
        const dx = a.x - b.x,
            dy = a.y - b.y;
        return Math.hypot(dx, dy);
    }
    // -------------------------------------------

    const modalHeader = useMemo(
        () => (
            <header>
                <span />
                <h3 id='modal-title'>{title}</h3>
                {!shouldUseBottomSheet ? (
                    <MdClose onClick={handleClose} color='var(--text2)' />
                ) : (
                    <span />
                )}
            </header>
        ),
        [title, shouldUseBottomSheet, handleClose],
    );

    const modalContent = useMemo(
        () => (
            <div ref={contentRef} className={styles.modalContent}>
                {children}
                <div className={styles.safeAreaSpacer}></div>
            </div>
        ),
        [children],
    );

    return (
        <div
            ref={modalRef}
            id={OUTSIDE_MODAL_DOM_ID}
            className={`${styles.outside_modal} ${
                actualPosition === 'bottomSheet'
                    ? styles.bottomSheetContainer
                    : actualPosition === 'bottomRight'
                      ? styles.bottomRightContainer
                      : ''
            } ${isKeyboardVisible ? styles.keyboardVisible : ''}`}
            role='dialog'
            aria-modal='true'
            aria-labelledby='modal-title'
            // NEW pointer-aware outside close
            onMouseDown={(e) => {
                pointerDownOnBackdrop.current = e.target === e.currentTarget;
                pointerDownPos.current = { x: e.clientX, y: e.clientY };
            }}
            onTouchStart={(e) => {
                const t = e.touches[0];
                pointerDownOnBackdrop.current = e.target === e.currentTarget;
                pointerDownPos.current = { x: t.clientX, y: t.clientY };
            }}
            onMouseUp={(e) => {
                if (!pointerDownOnBackdrop.current) return;
                if (e.target !== e.currentTarget) return;
                if (
                    pointerDownPos.current &&
                    distance(pointerDownPos.current, {
                        x: e.clientX,
                        y: e.clientY,
                    }) > MOVE_TOLERANCE
                )
                    return;
                handleClose();
            }}
            onTouchEnd={(e) => {
                if (!pointerDownOnBackdrop.current) return;
                const t = e.changedTouches[0];
                if (!t) return;
                if (
                    pointerDownPos.current &&
                    distance(pointerDownPos.current, {
                        x: t.clientX,
                        y: t.clientY,
                    }) > MOVE_TOLERANCE
                )
                    return;
                handleClose();
            }}
        >
            {actualPosition === 'bottomSheet' ? (
                <div
                    ref={bottomSheetRef}
                    className={`${styles.bottomSheet} ${animation} ${
                        isKeyboardVisible ? styles.keyboardActive : ''
                    }`}
                >
                    <div
                        ref={handleRef}
                        className={styles.bottomSheetHandle}
                        onTouchStart={handleDragStart}
                        onTouchMove={handleDragMove}
                        onTouchEnd={handleDragEnd}
                        onMouseDown={handleDragStart}
                    >
                        <div className={styles.handle}></div>
                    </div>
                    {modalHeader}
                    {modalContent}
                </div>
            ) : (
                <div className={styles.centerModal}>
                    {modalHeader}
                    {modalContent}
                </div>
            )}
        </div>
    );
}

export default React.memo(Modal);
