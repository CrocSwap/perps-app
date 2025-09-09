import { FaDiscord } from 'react-icons/fa';
import { RiTwitterXFill } from 'react-icons/ri';
// import { IoIosInformationCircle } from 'react-icons/io';
// import { useTutorial } from '~/hooks/useTutorial';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import packageJson from '../../../../package.json';
import styles from './DropdownMenu.module.css';
import { externalURLs } from '~/utils/Constants';

const menuItems = [
    // { name: 'Docs', icon: <FaFileAlt /> },
    {
        name: '𝕏 / Twitter',
        icon: <RiTwitterXFill />,
        url: externalURLs.twitter,
    },
    {
        name: 'Discord',
        icon: <FaDiscord />,
        url: externalURLs.discord,
    },
    // { name: 'Medium', icon: <FaMediumM /> },
    // { name: 'Privacy', icon: <FaUserSecret /> },
    // { name: 'Terms of Service', icon: <FaFileAlt /> },
    // { name: 'FAQ', icon: <LuCircleHelp /> },
];

interface DropdownMenuProps {
    setIsDropdownMenuOpen: (open: boolean) => void;
}

const DropdownMenu = ({ setIsDropdownMenuOpen }: DropdownMenuProps) => {
    const sessionState = useSession();
    // const { handleRestartTutorial } = useTutorial();

    // const handleTutorialClick = () => {
    //     console.log(
    //         'Tutorial button clicked in DropdownMenu, restarting tutorial...',
    //     );
    //     handleRestartTutorial();
    // };

    return (
        <div className={styles.container}>
            {menuItems.map((item) => (
                <div
                    key={JSON.stringify(item)}
                    className={styles.menuItem}
                    onClick={() => {
                        window.open(item.url, '_blank');
                        if (typeof plausible === 'function') {
                            plausible('External Link Clicked', {
                                props: {
                                    linkType: item.name,
                                },
                            });
                        }
                    }}
                >
                    <span>{item.name}</span>
                    <span>{item.icon}</span>
                </div>
            ))}
            {/* <button
                className={styles.tutorialButton}
                onClick={handleTutorialClick}
            >
                Tutorial <IoIosInformationCircle size={22} />
            </button> */}
            <div className={styles.version}>
                Version: {packageJson.version.split('-')[0]}
            </div>
            {isEstablished(sessionState) && (
                <button
                    className={styles.logoutButton}
                    onClick={() => {
                        sessionState.endSession();
                        setIsDropdownMenuOpen(false);
                    }}
                >
                    Log Out
                </button>
            )}
        </div>
    );
};

export default DropdownMenu;
