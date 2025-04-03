import { useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import { FiSearch } from 'react-icons/fi';
import VaultRow from '~/components/Vault/VaultRow/VaultRow';
import VaultRowHeader from '~/components/Vault/VaultRowHeader/VaultRowHeader';
import VaultTimeframe from '~/components/Vault/VaultTimeframe/VaultTimeframe';
import type { Route } from '../../+types/root';
import { protocolVaults } from './data';
import styles from './vaults.module.css';
// import styles from './vaults.module.css'
export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Perps - Vaults' },
        { name: 'description', content: 'Welcome to React Router!' },
    ];
}

export function loader({ context }: Route.LoaderArgs) {
    console.log('loader');
    return { message: context.VALUE_FROM_NETLIFY };
}

export default function Vaults({ loaderData }: Route.ComponentProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>(
        {},
    );
    const [activeTimeframe, setActiveTimeframe] = useState<string>('30D');
    const [isTimeframeDropdownOpen, setIsTimeframeDropdownOpen] =
        useState(false);

    const filters: string[] = ['Leading', 'Deposited', 'Others', 'Closed'];

    const toggleFilter = (filter: string) => {
        setActiveFilters((prev) => ({
            ...prev,
            [filter]: !prev[filter],
        }));
    };

    return (
        <div className={styles.container}>
            <section className={styles.headerContainer}>
                <div className={styles.totalValueContainer}>
                    <h3>$69.000,000</h3>
                    <p>
                        Total Value Locked.
                        <a href='/' className={styles.learnMore}>
                            Learn more
                        </a>
                    </p>
                </div>
                {/* <Button size='medium' selected>
          Text
        </Button> */}
            </section>

            <section className={styles.tableContainer}>
                <header>
                    <div className={styles.searchContainer}>
                        <div className={styles.icon}>
                            <FiSearch size={18} />
                        </div>
                        <input
                            type='text'
                            placeholder='Search by vault address, name, or leader...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        <div className={styles.icon}>
                            {searchQuery && (
                                <AiOutlineClose
                                    size={18}
                                    onClick={() => setSearchQuery('')}
                                />
                            )}
                        </div>
                    </div>

                    <div className={styles.rightSide}>
                        <div className={styles.filterButtonsContainer}>
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    className={`${styles.filterButton} ${
                                        activeFilters[filter]
                                            ? styles.activeFilterButton
                                            : styles.inactiveFilterButton
                                    }`}
                                    onClick={() => toggleFilter(filter)}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                        <VaultTimeframe
                            timeframe={activeTimeframe}
                            setTimeframe={setActiveTimeframe}
                            open={isTimeframeDropdownOpen}
                            setOpen={setIsTimeframeDropdownOpen}
                        />
                    </div>
                </header>

                <section className={styles.vaultSectionContainer}>
                    <h3 className={styles.sectionTitle}>Protocol Vaults</h3>
                    <VaultRowHeader />
                    {protocolVaults.map((vault, idx) => (
                        <VaultRow vault={vault} />
                    ))}
                </section>
                {/* <section className={styles.vaultSectionContainer}>
          <h3 className={styles.sectionTitle}>User Vaults</h3>
          <VaultRowHeader/>
          {userVaults.map((vault, idx) => (
            <VaultRow vault={vault} />
          ))}

        </section> */}
            </section>
        </div>
    );
}
