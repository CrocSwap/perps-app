import { useEffect, useRef, useState } from 'react';
import styles from './TransferDropdown.module.css';
import { LuChevronDown } from 'react-icons/lu';

interface propsIF {
    idForDOM: string;
    labelText: string;
    active: string;
    options: string[];
    handleChange: (option: string) => void;
}

export default function TransferDropdown(props: propsIF) {
    const { idForDOM, labelText, active, options, handleChange } = props;

    // boolean controlling whether the dropdown interface is open
    const [isOpen, setIsOpen] = useState<boolean>(false);

    // logic to close the dropdown on an outside click
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (dropdownRef.current && event.target instanceof Node) {
                if (!dropdownRef.current.contains(event.target)) {
                    setIsOpen(false);
                }
            }
        };
        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen]);

    // boolean whether the user has modified input from initial placeholder
    const [isInitial, setIsInitial] = useState<boolean>(
        !options.includes(active),
    );

    return (
        <div className={styles.transfer_dropdown}>
            <div>{labelText}</div>
            <div className={styles.dropdown} ref={dropdownRef}>
                <button onClick={() => setIsOpen(!isOpen)}>
                    <output
                        id={idForDOM}
                        style={{
                            color: isInitial ? 'var(--text3)' : 'inherit',
                        }}
                    >
                        {active}
                    </output>
                    <LuChevronDown size={16} color={'var(--text2)'} />
                </button>
                {isOpen && (
                    <ul>
                        {options.map((option: string) => (
                            <li
                                key={option}
                                onClick={() => {
                                    handleChange(option);
                                    setIsInitial(false);
                                    setIsOpen(false);
                                }}
                            >
                                {option}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
