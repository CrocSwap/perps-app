import { Link } from 'react-router';
import styles from './HelpDropdown.module.css';
import { IoIosClose } from 'react-icons/io';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import { useTutorial } from '~/hooks/useTutorial';

interface propsIF {
    setIsHelpDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function HelpDropdown(props: propsIF) {
    const { setIsHelpDropdownOpen } = props;

    const { handleRestartTutorial } = useTutorial();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                Need help?
                <IoIosClose
                    color='var(--text2)'
                    onClick={() => setIsHelpDropdownOpen(false)}
                />
            </header>
            <div className={styles.content}>
                <SimpleButton bg='dark4' hoverBg='accent1'>
                    Withdraw
                </SimpleButton>
                <SimpleButton
                    bg='accent1'
                    className={styles.depositButton}
                    onClick={handleRestartTutorial}
                >
                    Launch Tutorial
                </SimpleButton>
            </div>
        </div>
    );
}
