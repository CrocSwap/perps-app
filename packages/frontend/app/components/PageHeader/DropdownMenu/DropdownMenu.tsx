import {
    FaDiscord,
    FaFileAlt,
    FaMediumM,
    FaQuestionCircle,
    FaTwitter,
    FaUserSecret,
} from 'react-icons/fa';
import { IoIosInformationCircle } from 'react-icons/io';
import styles from './DropdownMenu.module.css';
import { useTutorial } from '~/hooks/useTutorial';

const menuItems = [
    { name: 'Docs', icon: <FaFileAlt /> },
    { name: 'Twitter', icon: <FaTwitter /> },
    { name: 'Discord', icon: <FaDiscord /> },
    { name: 'Medium', icon: <FaMediumM /> },
    { name: 'Privacy', icon: <FaUserSecret /> },
    { name: 'Terms of Service', icon: <FaFileAlt /> },
    { name: 'FAQ', icon: <FaQuestionCircle /> },
];

const DropdownMenu = () => {
    // Use the tutorial hook - the name stays the same!
    const { handleRestartTutorial } = useTutorial();

    const handleTutorialClick = () => {
        console.log(
            'Tutorial button clicked in DropdownMenu, restarting tutorial...',
        );
        handleRestartTutorial();
    };

    return (
        <div className={styles.container}>
            {menuItems.map((item, index) => (
                <div key={index} className={styles.menuItem}>
                    <span>{item.name}</span>
                    <span>{item.icon}</span>
                </div>
            ))}
            <button
                className={styles.tutorialButton}
                onClick={handleTutorialClick}
            >
                Tutorial <IoIosInformationCircle size={22} />
            </button>
            <div className={styles.version}>Version: 1.4</div>
            <button className={styles.logoutButton}>Log Out</button>
        </div>
    );
};

export default DropdownMenu;
