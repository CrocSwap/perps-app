import { useEffect, useRef, useState, type JSX } from 'react';
import { SlArrowDown } from 'react-icons/sl';
import styles from './OptionLineSelect.module.css';

interface dropdownOptionsIF {
    readable: string | JSX.Element;
    set: () => void;
}

interface propsIF {
    text: string;
    active: string | JSX.Element;
    options: dropdownOptionsIF[];
    dropDirection?: 'down' | 'up';
}

export default function OptionLineSelect(props: propsIF) {
    const { text, active, options, dropDirection = 'down' } = props;

    // boolean to track whether the options dropdown is open
    const [isOpen, setIsOpen] = useState<boolean>(false);

    // clicks outside the elem with the ref will close the dropdown
    const dropdownRef = useRef<HTMLDivElement>(null);

    const triggerRef = useRef<HTMLButtonElement>(null);
    const firstOptionRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const prevIsOpenRef = useRef<boolean>(false);
    // logic to close the dropdown
    // using `isOpen` in gatekeeping and dependencies seem to speed it up
    useEffect(() => {
        // use mousedown event to trigger action in DOM
        const TRIGGER = 'mousedown';
        // fn to run in response to mousedown
        const handleClickOutside = (event: MouseEvent): void => {
            // determine if this elem or children were clicked
            // gatekeeping with `isOpen` seems to save computation time
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                isOpen
            ) {
                setIsOpen(false);
            }
        };
        // add event listener to DOM when component mounts
        // wait for menu to be opened before adding event listener, seems
        // ... to help things move faster
        if (isOpen) document.addEventListener(TRIGGER, handleClickOutside);
        // remove event listener from DOM when component dismounts
        return () => document.removeEventListener(TRIGGER, handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        // Only manage focus on state transitions, not on initial mount.
        // Otherwise, each closed dropdown will "steal" focus when the modal opens.
        const wasOpen = prevIsOpenRef.current;
        if (!wasOpen && isOpen) {
            firstOptionRef.current?.focus();
        } else if (wasOpen && !isOpen) {
            triggerRef.current?.focus();
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen]);

    return (
        <li className={styles.option_line}>
            {text}

            <div className={styles.dropdown_container} ref={dropdownRef}>
                <button
                    type='button'
                    ref={triggerRef}
                    className={styles.active_option}
                    onClick={() => setIsOpen((o) => !o)}
                    aria-haspopup='listbox'
                    aria-expanded={isOpen}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape' && isOpen) {
                            setIsOpen(false);
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        if (e.key === 'ArrowDown') {
                            setIsOpen(true);
                            e.preventDefault();
                        }
                    }}
                >
                    {active}
                    <SlArrowDown
                        className={`${styles.caret} ${isOpen ? styles.caret_open : ''} ${
                            dropDirection === 'up' ? styles.caret_up : ''
                        }`}
                    />
                </button>

                {isOpen && (
                    <div
                        className={`${styles.options_dropdown} ${
                            dropDirection === 'up'
                                ? styles.drop_up
                                : styles.drop_down
                        }`}
                        role='listbox'
                    >
                        {options.map((o: dropdownOptionsIF, i) => (
                            <button
                                type='button'
                                key={i}
                                ref={(el) => {
                                    optionRefs.current[i] = el;
                                    if (i === 0) firstOptionRef.current = el;
                                }}
                                onClick={() => {
                                    o.set();
                                    setIsOpen(false);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setIsOpen(false);
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const nextIndex =
                                            (i + 1) % options.length;
                                        optionRefs.current[nextIndex]?.focus();
                                    }
                                    if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const prevIndex =
                                            (i - 1 + options.length) %
                                            options.length;
                                        optionRefs.current[prevIndex]?.focus();
                                    }
                                }}
                                role='option'
                            >
                                {o.readable}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </li>
    );
}
