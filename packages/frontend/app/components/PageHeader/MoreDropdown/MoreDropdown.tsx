import styles from './MoreDropdown.module.css';

export default function MoreDropdown() {
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
                <a href={menu.link}>{menu.name}</a>
            ))}
        </div>
    );
}
