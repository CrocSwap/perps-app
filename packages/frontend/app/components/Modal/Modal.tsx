import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useMobile } from '~/hooks/useMediaQuery';
import { useGlobalModal } from './GlobalModalHost';

type positions = 'center' | 'bottomRight' | 'bottomSheet';

interface ModalProps {
    close?: () => void;
    position?: positions;
    children: ReactNode;
    mobileBreakpoint?: number;
    forceBottomSheet?: boolean;
    noHeader?: boolean;
    title: string;
    stopOutsideClick?: boolean;
}

/** Proxy component that forwards its content to the GlobalModalHost. */
export default function Modal(props: ModalProps) {
    const {
        close,
        position = 'center',
        children,
        mobileBreakpoint = 768,
        forceBottomSheet = false,
        title,
        noHeader = false,
        stopOutsideClick = false,
    } = props;

    const isMobile = useMobile(mobileBreakpoint);
    const shouldUseBottomSheet = forceBottomSheet || isMobile;
    const actualPosition: positions = shouldUseBottomSheet
        ? 'bottomSheet'
        : position;

    const { present, dismiss, update } = useGlobalModal();

    // If a consumer renders <Modal/> without a close fn, just render children (bc legacy)
    if (!close) return <>{children}</>;

    // Mount → present; Update on prop change; Unmount → dismiss (no callback)
    useEffect(() => {
        present({
            title,
            position: actualPosition,
            content: children,
            noHeader,
            onRequestClose: close, // host closes → call caller's close()
            stopOutsideClick,
        });

        return () => {
            // external unmount, don't call the caller again
            dismiss('external');
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount

    // Keep host in sync if props/children change while mounted
    useEffect(() => {
        update({
            title,
            noHeader,
            position: actualPosition,
            content: children,
            stopOutsideClick,
        });
    }, [title, actualPosition, children, noHeader, stopOutsideClick, update]);

    // Nothing is rendered locally; global host handles it.
    return null;
}
