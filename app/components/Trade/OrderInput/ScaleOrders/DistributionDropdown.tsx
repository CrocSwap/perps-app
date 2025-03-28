import React from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import Tooltip from '~/components/Tooltip/Tooltip';
import SVGIcon from '~/components/SvgIcon/SvgIcon';
import useOutsideClick from '~/hooks/useOutsideClick';
import styles from './ScaleOrders.module.css';

interface DistributionOption<T extends string> {
  type: T;
  label: string;
  icon: React.ReactNode;
  iconClassName: string;
}

interface DistributionDropdownProps<T extends string> {
  label: string;
  tooltipContent: string;
  options: DistributionOption<T>[];
  currentValue: T;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (isOpen: boolean) => void;
  onOptionSelect: (type: T) => void;
  headerClassName?: string;
}

export default function DistributionDropdown<T extends string>({
  label,
  tooltipContent,
  options,
  currentValue,
  isDropdownOpen,
  setIsDropdownOpen,
  onOptionSelect,
  headerClassName,
}: DistributionDropdownProps<T>) {
  const dropdownRef = useOutsideClick<HTMLDivElement>(() => {
    setIsDropdownOpen(false);
  }, isDropdownOpen);

  const currentOption = options.find(option => option.type === currentValue);

  return (
    <div className={headerClassName} ref={dropdownRef}>
      <span className={styles.optionHeader}>
        {label}
        <Tooltip content={tooltipContent} position='right'>
          <AiOutlineQuestionCircle size={13} />
        </Tooltip>
      </span>

      <div
        className={styles.dropdownToggle}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        {currentOption && (
          <span className={styles.priceDistributionIcon}>
            <SVGIcon
              icon={currentOption.icon}
              className={currentOption.iconClassName}
            />
          </span>
        )}
        <div className={styles.dropdownIcon}>
          <FaChevronDown size={16} />
        </div>
      </div>

      {isDropdownOpen && (
        <div className={styles.dropdown}>
          {options.map((option) => (
            <div
              key={option.type}
              className={styles.dropdownItem}
              onClick={() => onOptionSelect(option.type)}
            >
              <SVGIcon
                icon={option.icon}
                className={option.iconClassName}
              />{' '}
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}