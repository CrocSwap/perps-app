import styles from './testpage.module.css';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import { useState, useMemo } from 'react';
import { useUserDataStore } from '~/stores/UserDataStore';

// JSON syntax highlighter component
function JsonHighlighter({ data }: { data: any }) {
    const jsonString = JSON.stringify(data, null, 2);

    const highlightJson = (str: string) => {
        // Replace different JSON elements with highlighted spans
        return str.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match) => {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return `<span class="${cls}">${match}</span>`;
            },
        );
    };

    return (
        <pre
            className={styles.json_output}
            dangerouslySetInnerHTML={{ __html: highlightJson(jsonString) }}
        />
    );
}

export default function testpage() {
    const WALLETS: [string, string][] = [
        ['emily 1', '74yqP7Me1Se7sKMEg6rQ5xovggkJ91GcM5LE2pGQzekm'],
        ['emily 2', 'G8KG3KA37gcuyJtCAxbt1hbPDedvQUuKr9KcE2c7JbxM'],
        ['emily 3', '5Ah3znF6g6y1ZFzG4eU9rkBTa4fjmGUMhbqP35WRvMyh'],
        ['emily 4', 'FF7uAzvkSSEXUiAMXfoxzrdeE9tVuiHQGYEfS8ikTtso'],
        ['emily 5', 'BVeiDUbJR5e55kgWtxTYKCkCDRxVKvNJfVhqbdaMQ6ds'],
        ['emily 6', '391zSwyCt2aYyVKH99pymFjcBMFRo6s3BUMSaGDsDozs'],
        ['emily 7', 'EpNuADE6TgEHzwUhh4vcods49ZqNPCQZ3PbV4EmNR987'],
        ['ben 1', '4aHN2EdGYnQ5RWhjQvh5hyuH82VQbyDQMhFWLrz1BeDy'],
        ['junior 1', '6FByxPz7yTmAbjGoXXhveXcXgLUTb8ipGsuEa3Kn5Pqb'],
        ['junior 2', 'C3fyGm1gChMcfNEpoB7RwPmXxPM5ZoComG1omXbzC4Aj'],
    ];

    const userDataStore = useUserDataStore();
    const userAddress = userDataStore.userAddress;

    // Manual wallet input state
    const [manualWalletName, setManualWalletName] = useState('');
    const [manualWalletAddress, setManualWalletAddress] = useState('');
    const [manualWallet, setManualWallet] = useState<[string, string] | null>(
        null,
    );

    // Check if connected wallet is already in the list
    const isConnectedWalletInList = useMemo(() => {
        if (!userAddress) return false;
        return WALLETS.some(
            ([_, address]) => address === userAddress.toString(),
        );
    }, [userAddress]);

    // Create combined wallets list with manual wallet first, then connected wallet, then hardcoded list
    const allWallets: [string, string][] = useMemo(() => {
        const wallets = [...WALLETS];

        // Add connected wallet if not in hardcoded list
        if (userAddress && !isConnectedWalletInList) {
            wallets.unshift([
                '<<active connected wallet>>',
                userAddress.toString(),
            ]);
        }

        // Add manual wallet first if it exists
        if (manualWallet) {
            wallets.unshift(manualWallet);
        }

        return wallets;
    }, [userAddress, isConnectedWalletInList, manualWallet]);

    type WalletData = {
        data: any;
        loading: boolean;
        error: string | null;
        statusCode?: number;
    };

    const [walletDataMap, setWalletDataMap] = useState<
        Record<string, WalletData>
    >({});

    async function fetchWallet(name: string, address: string) {
        const EMBER_ENDPOINT_BASE =
            'https://ember-leaderboard.liquidity.tools/leaderboard';
        const endpoint = `${EMBER_ENDPOINT_BASE}/${address}`;

        console.log(`Fetching for ${name}:`, endpoint);

        // Set loading state
        setWalletDataMap((prev) => ({
            ...prev,
            [address]: { data: null, loading: true, error: null },
        }));

        try {
            console.time(`Fetch ${name}`);
            const response = await fetch(endpoint);
            console.timeEnd(`Fetch ${name}`);

            const statusCode = response.status;
            console.log(`${name} status code:`, statusCode);

            console.time(`Parse ${name}`);
            const data = await response.json();
            console.timeEnd(`Parse ${name}`);

            console.log(`${name} data:`, data);

            setWalletDataMap((prev) => ({
                ...prev,
                [address]: { data, loading: false, error: null, statusCode },
            }));
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Unknown error';
            console.error(`Error fetching ${name}:`, err);

            setWalletDataMap((prev) => ({
                ...prev,
                [address]: { data: null, loading: false, error: errorMessage },
            }));
        }
    }

    async function fetchAllWallets() {
        // Fetch data for each wallet
        const fetchPromises = allWallets.map(([name, address]) =>
            fetchWallet(name, address),
        );

        await Promise.all(fetchPromises);
    }

    function handleManualSubmit() {
        if (!manualWalletAddress.trim() || !manualWalletName.trim()) {
            alert('Please enter both name and address');
            return;
        }

        // Check if name already exists in WALLETS
        const nameExists = WALLETS.some(
            ([name]) =>
                name.toLowerCase() === manualWalletName.trim().toLowerCase(),
        );
        if (nameExists) {
            alert(
                `Name "${manualWalletName}" already exists in the wallet list`,
            );
            return;
        }

        // Check if address already exists in WALLETS
        const addressExists = WALLETS.some(
            ([_, address]) => address === manualWalletAddress.trim(),
        );
        if (addressExists) {
            alert(
                `Address "${manualWalletAddress}" already exists in the wallet list`,
            );
            return;
        }

        const wallet: [string, string] = [
            manualWalletName.trim(),
            manualWalletAddress.trim(),
        ];
        setManualWallet(wallet);

        // Fetch data for this wallet
        fetchWallet(manualWalletName.trim(), manualWalletAddress.trim());

        // Clear inputs
        setManualWalletName('');
        setManualWalletAddress('');
    }

    return (
        <div className={styles.testpage}>
            <div className={styles.header}>
                <h2>Ember Leaderboard Test</h2>
                <SimpleButton
                    bg='dark2'
                    hoverBg='accent1'
                    onClick={fetchAllWallets}
                >
                    Fetch All Wallets
                </SimpleButton>
            </div>

            <div className={styles.manual_input}>
                <h3>Manual Wallet Lookup</h3>
                <div className={styles.input_row}>
                    <div className={styles.input_field}>
                        <label htmlFor='wallet-name'>Name</label>
                        <input
                            id='wallet-name'
                            type='text'
                            value={manualWalletName}
                            onChange={(e) =>
                                setManualWalletName(e.target.value)
                            }
                            placeholder='Enter wallet name'
                        />
                    </div>
                    <div className={styles.input_field}>
                        <label htmlFor='wallet-address'>Address</label>
                        <input
                            id='wallet-address'
                            type='text'
                            value={manualWalletAddress}
                            onChange={(e) =>
                                setManualWalletAddress(e.target.value)
                            }
                            placeholder='Enter wallet address'
                        />
                    </div>
                </div>
                <SimpleButton
                    bg='dark2'
                    hoverBg='accent1'
                    onClick={handleManualSubmit}
                >
                    Submit
                </SimpleButton>
            </div>

            <div className={styles.wallets_grid}>
                {allWallets.map(([name, address]) => {
                    const walletData = walletDataMap[address];
                    const isConnected =
                        userAddress && address === userAddress.toString();

                    return (
                        <div key={address} className={styles.wallet_card}>
                            <div className={styles.wallet_header}>
                                <div className={styles.wallet_header_left}>
                                    <h3 style={{ margin: 0 }}>{name}</h3>
                                    {isConnected && (
                                        <span className={styles.connected_tag}>
                                            CONNECTED
                                        </span>
                                    )}
                                </div>
                                <button
                                    className={styles.refresh_button}
                                    onClick={() => fetchWallet(name, address)}
                                    disabled={walletData?.loading}
                                    aria-label={`Refresh ${name}`}
                                >
                                    {walletData?.loading ? '↻' : '↻ Refresh'}
                                </button>
                            </div>
                            <p className={styles.wallet_address}>{address}</p>

                            {walletData?.statusCode && (
                                <div className={styles.status_code}>
                                    <strong>Status:</strong>
                                    <span
                                        className={
                                            walletData.statusCode >= 200 &&
                                            walletData.statusCode < 300
                                                ? styles.status_success
                                                : styles.status_error
                                        }
                                    >
                                        {walletData.statusCode}
                                    </span>
                                </div>
                            )}

                            {walletData?.data?.description && (
                                <div className={styles.description}>
                                    <strong>Description:</strong>{' '}
                                    {walletData.data.description}
                                </div>
                            )}

                            {walletData?.loading && <p>Loading...</p>}

                            {walletData?.error && (
                                <div
                                    style={{
                                        color: 'red',
                                        marginTop: '0.5rem',
                                    }}
                                >
                                    <strong>Error:</strong> {walletData.error}
                                </div>
                            )}

                            {walletData?.data && (
                                <div className={styles.wallet_data}>
                                    <JsonHighlighter data={walletData.data} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
