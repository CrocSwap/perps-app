import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import styles from './InputText.module.css';
import { LuChevronDown } from 'react-icons/lu';
import type { textInputIF } from './CreateStrategy';

interface propsIF {
    initial: string;
    data: textInputIF;
    handleChange: (text: string) => void;
}

export default function InputText(props: propsIF) {
    const { initial, data, handleChange } = props;
    console.log(initial);

    const idForDOM: string =
        'CREATE_STRATEGY_' + data.label.toUpperCase().replace(' ', '_');

    const [isOpen, setIsOpen] = useState<boolean>(false);
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

    return (
        <div className={styles.text_input}>
            <label htmlFor={idForDOM}>{data.label}</label>
            {typeof data.input === 'string' && (
                <input
                    type='text'
                    id={idForDOM}
                    value={initial}
                    placeholder={data.input}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleChange(e.currentTarget.value)
                    }
                    autoComplete='off'
                />
            )}
            {Array.isArray(data.input) && (
                <div className={styles.dropdown} ref={dropdownRef}>
                    <button onClick={() => setIsOpen(!isOpen)}>
                        <output
                            id={idForDOM}
                            onChange={() => console.log('wowee')}
                        >
                            {initial}
                        </output>
                        <LuChevronDown />
                    </button>
                    {isOpen && (
                        <ul>
                            {data.input.map((inp: string) => (
                                <li
                                    key={inp}
                                    onClick={() => {
                                        handleChange(inp);
                                        setIsOpen(false);
                                    }}
                                >
                                    {inp}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            <p>{data.blurb}</p>
        </div>
    );
}
