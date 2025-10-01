import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './OrderDropdown.module.css';
import { FiChevronDown } from 'react-icons/fi';

interface DropdownOption {
    value: string;
    label: string;
}

interface DropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    dropdownStyles?: React.CSSProperties;
    disabled?: boolean;
}

export default function OrderDropdown({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    className = '',
    dropdownStyles = {},
    disabled = false,
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((option) => option.value === value);

    const toggleDropdown = () => {
        if (!disabled) setIsOpen(!isOpen);
    };

    const handleOptionSelect = (option: DropdownOption) => {
        onChange(option.value);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const dropdownVariants = {
        closed: {
            opacity: 0,
            y: -10,
            scale: 0.95,
            transition: {
                duration: 0.2,
                ease: [0.4, 0.0, 0.2, 1],
            },
        },
        open: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.3,
                ease: [0.4, 0.0, 0.2, 1],
                staggerChildren: 0.05,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        closed: {
            opacity: 0,
            x: -10,
            transition: {
                duration: 0.15,
                ease: [0.4, 0.0, 0.2, 1],
            },
        },
        open: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.2,
                ease: [0.4, 0.0, 0.2, 1],
            },
        },
    };

    const chevronVariants = {
        closed: {
            rotate: 0,
            transition: {
                duration: 0.3,
                ease: [0.4, 0.0, 0.2, 1],
            },
        },
        open: {
            rotate: 180,
            transition: {
                duration: 0.3,
                ease: [0.4, 0.0, 0.2, 1],
            },
        },
    };

    return (
        <div
            className={`${styles.dropdownContainer} ${className}`}
            ref={dropdownRef}
            style={dropdownStyles}
        >
            <motion.button
                className={`${styles.dropdownToggle} ${disabled ? styles.disabled : ''}`}
                onClick={toggleDropdown}
                disabled={disabled}
                type='button'
                whileTap={disabled ? {} : { scale: 0.98 }}
                transition={{ duration: 0.1 }}
            >
                <span className={styles.selectedText}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <motion.div
                    variants={chevronVariants}
                    animate={isOpen ? 'open' : 'closed'}
                >
                    <FiChevronDown size={20} />
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        className={styles.dropdownMenu}
                        role='listbox'
                        variants={dropdownVariants}
                        initial='closed'
                        animate='open'
                        exit='closed'
                        style={{ originY: 0 }}
                    >
                        {options.map((option, index) => (
                            <motion.li
                                key={option.value}
                                className={`${styles.dropdownItem} ${option.value === value ? styles.selected : ''}`}
                                onClick={() => handleOptionSelect(option)}
                                role='option'
                                aria-selected={option.value === value}
                                variants={itemVariants}
                                whileHover={{
                                    x: 4,
                                    transition: {
                                        duration: 0.15,
                                        ease: 'easeOut',
                                    },
                                }}
                                whileTap={{ scale: 0.98 }}
                                custom={index}
                            >
                                {option.label}
                            </motion.li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}
