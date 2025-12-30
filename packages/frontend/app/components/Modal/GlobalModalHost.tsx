import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent,
    type ReactNode,
    type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { MdClose } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import styles from './Modal.module.css';

export type ModalPosition = 'center' | 'bottomRight' | 'bottomSheet';

type Payload = {
    title: string;
    position: ModalPosition;
    content: ReactNode;
    /** called only when user closes from the host (backdrop/close/drag) */
    onRequestClose?: () => void;
};

type Ctx = {
    present: (p: Payload) => void;
    update: (p: Partial<Payload>) => void;
    /** internal close (fires onRequestClose) or external (no callback) */
    dismiss: (reason?: 'internal' | 'external') => void;
    isOpen: boolean;
};

const ModalCtx = createContext<Ctx | null>(null);

export function useGlobalModal() {
    const ctx = useContext(ModalCtx);
    if (!ctx)
        throw new Error(
            'useGlobalModal must be used inside <GlobalModalHost/>',
        );
    return ctx;
}

export function GlobalModalHost({ children }: { children?: ReactNode }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [payload, setPayload] = useState<Payload | null>(null);

    const present = useCallback((p: Payload) => {
        setPayload(p);
        setOpen(true);
    }, []);

    const update = useCallback((p: Partial<Payload>) => {
        setPayload((cur) => (cur ? { ...cur, ...p } : cur));
    }, []);

    const dismiss = useCallback(
        (reason: 'internal' | 'external' = 'internal') => {
            setOpen(false);
            if (reason === 'internal') payload?.onRequestClose?.();
        },
        [payload],
    );

    // html class for scroll lock
    useEffect(() => {
        if (open) document.documentElement.classList.add('modal-open');
        else document.documentElement.classList.remove('modal-open');
    }, [open]);

    const backdropPointerDownOnSelf = useRef(false);
    const previouslyFocusedElement = useRef<HTMLElement | null>(null);
    const modalContainerRef = useRef<HTMLDivElement | null>(null);

    // Focus management: save previous focus and restore on close
    useEffect(() => {
        if (open) {
            previouslyFocusedElement.current =
                document.activeElement as HTMLElement;
            // Focus the modal container or first focusable element
            setTimeout(() => {
                const initialFocusEl =
                    modalContainerRef.current?.querySelector<HTMLElement>(
                        '[data-modal-initial-focus]',
                    );

                if (
                    initialFocusEl &&
                    !initialFocusEl.hasAttribute('disabled')
                ) {
                    initialFocusEl.focus();
                    return;
                }

                // Focus the modal container itself (not the close button) to avoid
                // showing a focus ring when opened via keyboard shortcut.
                // The container is focusable via tabindex="-1" for accessibility.
                modalContainerRef.current?.focus();
            }, 0);
        } else {
            // Restore focus when modal closes
            previouslyFocusedElement.current?.focus();
        }
    }, [open]);

    // Focus trap handler
    const handleFocusTrap = useCallback((e: ReactKeyboardEvent) => {
        if (e.key !== 'Tab' || !modalContainerRef.current) return;

        const focusableElements =
            modalContainerRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
        }
    }, []);

    // ---- bottom sheet drag  ----
    const sheetRef = useRef<HTMLDivElement | null>(null);
    const drag = useRef({ startY: 0, y: 0, active: false });

    const onDragStart = (clientY: number) => {
        drag.current = { startY: clientY, y: 0, active: true };
        if (sheetRef.current) sheetRef.current.style.transition = 'none';
    };

    const onDragMove = (clientY: number) => {
        if (!drag.current.active || !sheetRef.current) return;
        const dy = Math.max(0, clientY - drag.current.startY);
        drag.current.y = dy;
        sheetRef.current.style.transform = `translateY(${dy}px)`;
    };

    const onDragEnd = () => {
        if (!drag.current.active || !sheetRef.current) return;
        sheetRef.current.style.transition = 'transform 0.25s ease';
        const shouldClose =
            drag.current.y > sheetRef.current.offsetHeight * 0.3;
        if (shouldClose) {
            dismiss('internal');
        } else {
            sheetRef.current.style.transform = 'translateY(0)';
        }
        drag.current.active = false;
    };

    const handleMouseDown = (e: MouseEvent) => onDragStart(e.clientY);
    const handleMouseMove = (e: MouseEvent) => onDragMove(e.clientY);
    const handleMouseUp = () => onDragEnd();

    const handleTouchStart = (e: React.TouchEvent) =>
        onDragStart(e.touches[0].clientY);
    const handleTouchMove = (e: React.TouchEvent) =>
        onDragMove(e.touches[0].clientY);
    const handleTouchEnd = () => onDragEnd();

    const ctxValue = useMemo<Ctx>(
        () => ({ present, update, dismiss, isOpen: open }),
        [present, update, dismiss, open],
    );

    // Close on ESC while open
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.defaultPrevented) return;
            // 'Esc' for older browsers, 'Escape' standard
            if (e.key === 'Escape' || e.key === 'Esc') {
                e.preventDefault();
                e.stopPropagation();
                dismiss('internal');
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, dismiss]);

    return (
        <ModalCtx.Provider value={ctxValue}>
            {children}
            {open && payload && (
                <div
                    ref={modalContainerRef}
                    className={`${styles.outside_modal} ${
                        payload.position === 'bottomSheet'
                            ? styles.bottomSheetContainer
                            : payload.position === 'bottomRight'
                              ? styles.bottomRightContainer
                              : ''
                    }`}
                    role='dialog'
                    aria-modal='true'
                    aria-labelledby='global-modal-title'
                    tabIndex={-1}
                    onKeyDown={handleFocusTrap}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        backdropPointerDownOnSelf.current =
                            e.target === e.currentTarget;
                    }}
                    onPointerUp={(e) => {
                        e.stopPropagation();
                    }}
                    onPointerCancel={(e) => {
                        e.stopPropagation();
                        backdropPointerDownOnSelf.current = false;
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (
                            backdropPointerDownOnSelf.current &&
                            e.target === e.currentTarget
                        ) {
                            dismiss('internal');
                        }
                        backdropPointerDownOnSelf.current = false;
                    }}
                >
                    {payload.position === 'bottomSheet' ? (
                        <div
                            ref={sheetRef}
                            className={`${styles.bottomSheet} ${styles.slideUp}`}
                            onClick={(e) => e.stopPropagation()}
                            onMouseMove={
                                drag.current.active
                                    ? handleMouseMove
                                    : undefined
                            }
                            onMouseUp={
                                drag.current.active ? handleMouseUp : undefined
                            }
                            onMouseLeave={
                                drag.current.active ? handleMouseUp : undefined
                            }
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <div
                                className={styles.bottomSheetHandle}
                                onMouseDown={handleMouseDown}
                                onTouchStart={handleTouchStart}
                            >
                                <div className={styles.handle} />
                            </div>
                            <header>
                                <span />
                                <h3 id='global-modal-title'>{payload.title}</h3>
                                <button
                                    type='button'
                                    onClick={() => dismiss('internal')}
                                    aria-label={t('aria.closeModal')}
                                    className={styles.closeButton}
                                    data-modal-close
                                >
                                    <MdClose
                                        color='var(--text2)'
                                        aria-hidden='true'
                                    />
                                </button>
                            </header>
                            <div className={styles.modalContent}>
                                {payload.content}
                                <div className={styles.safeAreaSpacer} />
                            </div>
                        </div>
                    ) : (
                        <div
                            className={styles.centerModal}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <header>
                                <span />
                                <h3 id='global-modal-title'>{payload.title}</h3>
                                <button
                                    type='button'
                                    onClick={() => dismiss('internal')}
                                    aria-label={t('aria.closeModal')}
                                    className={styles.closeButton}
                                    data-modal-close
                                >
                                    <MdClose
                                        color='var(--text2)'
                                        aria-hidden='true'
                                    />
                                </button>
                            </header>
                            <div className={styles.modalContent}>
                                {payload.content}
                                <div className={styles.safeAreaSpacer} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </ModalCtx.Provider>
    );
}
