import React, { useState, useRef, useEffect } from 'react';
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
  disabled = false 
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  const toggleDropdown = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleOptionSelect = (option: DropdownOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`${styles.dropdownContainer} ${className}`} ref={dropdownRef} style={dropdownStyles}>
      <button 
        className={`${styles.dropdownToggle} ${disabled ? styles.disabled : ''}`} 
        onClick={toggleDropdown}
        disabled={disabled}
        type="button"
      >
        <span className={styles.selectedText}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FiChevronDown size={24} />

      </button>

      {isOpen && (
        <ul className={styles.dropdownMenu} role="listbox">
          {options.map(option => (
            <li 
              key={option.value}
              className={`${styles.dropdownItem} ${option.value === value ? styles.selected : ''}`}
              onClick={() => handleOptionSelect(option)}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
