import { useEffect, type ReactNode } from 'react';
import styles from './Modal.module.css';

type positions = 'center' | 'bottomRight';

interface positionCSS {
    position?: 'fixed';
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
}

const positionStyles: Record<positions, positionCSS> = {
    center: {
        position: 'fixed',
        top: '0',
        bottom: '0',
    },
    bottomRight: {
        position: 'fixed',
        bottom: '0',
        right: '0',
    },
};

interface propsIF {
    close?: () => void;
    position?: positions;
    children: ReactNode;
}

export default function Modal(props: propsIF) {
    const { close, position = 'center', children } = props;

    // return children without creating curtain behind modal
    // this allows us to make multiple non-exclusive modals at once
    if (!close) return children;

    // DOM id for the area outside modal body
    const OUTSIDE_MODAL_DOM_ID = 'outside_modal';

    // fn to handle a click outside the modal body
    function handleOutsideClick(target: HTMLDivElement): void {
        // close the modal if area outside the body was clicked directly
        target.id === OUTSIDE_MODAL_DOM_ID && close && close();
    }

    // event listener to close modal on `Escape` keydown event
    useEffect(() => {
        // type of event
        const EVENT_TYPE = 'keydown';
        // fn to close modal when the `Escape` key is pressed
        function handleEscape(evt: KeyboardEvent): void {
            evt.key === 'Escape' && close && close();
        }
        // add the event listener to the DOM
        document.addEventListener(EVENT_TYPE, handleEscape);
        // remove event listener from the DOM when component unmounts
        return () => document.removeEventListener(EVENT_TYPE, handleEscape);
    }, []);

    return (
        <div
            onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
                handleOutsideClick(e.target as HTMLDivElement)
            }
            id={OUTSIDE_MODAL_DOM_ID}
            className={styles.outside_modal}
            style={positionStyles[position]}
        >
            {children}
        </div>
    );
}
