import { Link } from 'react-router';
import styles from './MoreDropdown.module.css';

interface propsIF {
    setIsMoreDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MoreDropdown(props: propsIF) {
    const { setIsMoreDropdownOpen } = props;
    const submenuData = [
        { name: 'Testnet', link: '/testnet' },
        { name: 'Explorer', link: '/explorer' },
        { name: 'Sub-Accounts', link: '/subaccounts' },
        { name: 'API', link: '/api' },
        { name: 'Multi-Sig', link: '/multi-sig' },
        { name: 'Funding Comparison', link: '/funding-comparison' },
        { name: 'Stats', link: '/stats' },
        { name: 'Docs', link: '/docs' },
    ];

    return (
        <div className={styles.container}>
            {submenuData.map((menu, idx) => (
                <Link
                    to={menu.link}
                    key={idx}
                    className={styles.row}
                    viewTransition
                    onClick={() => setIsMoreDropdownOpen(false)}
                >
                    {menu.name}
                </Link>
            ))}
        </div>
    );
}
