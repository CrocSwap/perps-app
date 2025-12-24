import styles from './OptionLine.module.css';
import { FaCheck } from 'react-icons/fa';

interface propsIF {
    text: string;
    isChecked: boolean;
    toggle: () => void;
    autoFocus?: boolean;
}

export default function OptionLine(props: propsIF) {
    const { text, isChecked, toggle, autoFocus } = props;

    return (
        <li>
            <button
                type='button'
                className={styles.option_line}
                onClick={toggle}
                role='switch'
                aria-checked={isChecked}
                autoFocus={autoFocus}
            >
                <div
                    className={styles.checkbox}
                    style={{
                        borderColor: `var(${isChecked ? '--accent1' : '--text3'})`,
                    }}
                >
                    {isChecked && (
                        <FaCheck size={10} color={'var(--accent1)'} />
                    )}
                </div>
                {text}
            </button>
        </li>
    );
}
