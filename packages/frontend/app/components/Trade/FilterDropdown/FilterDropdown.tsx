import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import styles from './FilterDropdown.module.css';

export interface FilterOption {
    id: string;
    label: string;
}

export interface FilterDropdownProps {
    options: FilterOption[];
    selectedOption?: string;
    onChange: (selectedId: string) => void;
    label?: string;
}

export default function FilterDropdown(props: FilterDropdownProps) {
    const { t } = useTranslation();
    const {
        options,
        selectedOption,
        onChange,
        label = t('common.filter'),
    } = props;
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const selectOption = (optionId: string) => {
        onChange(optionId);
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
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
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Get the selected option label
    const getSelectedLabel = () => {
        if (!selectedOption) return label;
        const option = options.find((opt) => opt.id === selectedOption);
        return option ? option.label : label;
    };

    return (
        <div className={styles.filterContainer} ref={dropdownRef}>
            <button
                className={`${styles.filterButton} ${isOpen ? styles.active : ''}`}
                onClick={toggleDropdown}
                aria-haspopup='true'
                aria-expanded={isOpen}
            >
                {getSelectedLabel()}
                <svg
                    className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`}
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                >
                    <path
                        d='M12 15L18 9L16.6 7.6L12 12.2L7.4 7.6L6 9L12 15Z'
                        fill=''
                    />
                </svg>
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    {options.map((option) => (
                        <div
                            key={option.id}
                            className={`${styles.optionRow} ${selectedOption === option.id ? styles.selected : ''}`}
                            onClick={() => selectOption(option.id)}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
