import { useEffect, useRef, useState } from 'react';

// interface for return value of hook
export interface useModalIF {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

// default states for modal
//      'open' → modal is open on initial render
//      'closed' → modal is closed on initial render
//      number → modal will auto-open after X milliseconds
type modalDefaultStates = 'open' | 'closed' | number;

// main fn body for hook
export function useModal(defaultState?: modalDefaultStates): useModalIF {
    // variable to track if modal is open on initial render
    let shouldOpenAtRender: boolean;

    // track whether the modal has already auto-opened, gatekeeping prevents
    // ... multiple auto-opens while parent is mounted to DOM
    const isFirstOpening = useRef<boolean>(true);

    // logic tree to determine if modal is open on initial render
    switch (defaultState) {
        // open if hook is instantiated that way
        case 'open':
            // check if an auto-open has already occurred
            shouldOpenAtRender = isFirstOpening.current;
            // update state value to prevent more auto openings
            isFirstOpening.current = false;
            break;
        // closed if hook is called that way, with number, or with
        // ... no explicit state provided
        case 'closed':
        default:
            shouldOpenAtRender = false;
            break;
    }

    // state value to track if modal is currently open
    const [isOpen, setIsOpen] = useState<boolean>(shouldOpenAtRender);

    // modal control functions
    const openModal = (): void => {
        // let shouldOpen: boolean = true;
        // if (modalConfig?.limiterSlug && announcement.checkIfViewed(modalConfig.limiterSlug)) {
        //     shouldOpen = false;
        // }
        // setIsOpen(shouldOpen);
        setIsOpen(true);
    };
    const closeModal = (): void => setIsOpen(false);
    const toggleModal = (): void => setIsOpen(!isOpen);

    // logic to open the modal after a delay
    useEffect(() => {
        // do not execute unless hook instantiated with a number
        if (typeof defaultState !== 'number') return;
        // timeout to open modal after time set in parameter
        const openAfterDelay: NodeJS.Timeout = setTimeout(
            () => openModal(),
            defaultState,
        );
        // clear the effect from the DOM when elem dismounts
        return () => clearTimeout(openAfterDelay);
    }, []);

    // return obj
    return {
        isOpen,
        open: openModal,
        close: closeModal,
        toggle: toggleModal,
    };
}
