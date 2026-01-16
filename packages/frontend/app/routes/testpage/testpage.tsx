import styles from './testpage.module.css';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import { useState, useMemo } from 'react';
import { useUserDataStore } from '~/stores/UserDataStore';

// JSON syntax highlighter component
function JsonHighlighter({ data }: { data: any }) {
    const jsonString = JSON.stringify(data, null, 2);

    const highlightJson = (str: string) => {
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

export default function TestPage() {
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

    const [manualWalletName, setManualWalletName] = useState('');
    const [manualWalletAddress, setManualWalletAddress] = useState('');
    const [manualWallet, setManualWallet] = useState<[string, string] | null>(
        null,
    );

    const isConnectedWalletInList = useMemo(() => {
        if (!userAddress) return false;
        return WALLETS.some(
            ([_, address]) => address === userAddress.toString(),
        );
    }, [userAddress]);

    const allWallets: [string, string][] = useMemo(() => {
        const wallets = [...WALLETS];

        if (userAddress && !isConnectedWalletInList) {
            wallets.unshift([
                '<<active connected wallet>>',
                userAddress.toString(),
            ]);
        }

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
        const endpoint = `https://ember-leaderboard-v2.liquidity.tools/user/${address}`;

        setWalletDataMap((prev) => ({
            ...prev,
            [address]: { data: null, loading: true, error: null },
        }));

        try {
            const response = await fetch(endpoint);
            const data = await response.json();

            setWalletDataMap((prev) => ({
                ...prev,
                [address]: {
                    data,
                    loading: false,
                    error: null,
                    statusCode: response.status,
                },
            }));
        } catch (err) {
            setWalletDataMap((prev) => ({
                ...prev,
                [address]: {
                    data: null,
                    loading: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                },
            }));
        }
    }

    async function fetchAllWallets() {
        await Promise.all(
            allWallets.map(([name, address]) => fetchWallet(name, address)),
        );
    }

    function handleManualSubmit() {
        if (!manualWalletName || !manualWalletAddress) return;

        const wallet: [string, string] = [
            manualWalletName.trim(),
            manualWalletAddress.trim(),
        ];
        setManualWallet(wallet);
        fetchWallet(wallet[0], wallet[1]);
        setManualWalletName('');
        setManualWalletAddress('');
    }

    return (
        <div className={styles.testpage}>
            <div className={styles.header}>
                <h2>Ember Leaderboard Test</h2>
                <SimpleButton onClick={fetchAllWallets}>
                    Fetch All Wallets
                </SimpleButton>
            </div>

            <div className={styles.wallets_grid}>
                {allWallets.map(([name, address]) => {
                    const walletData = walletDataMap[address];
                    return (
                        <div key={address} className={styles.wallet_card}>
                            <h3>{name}</h3>
                            <p>{address}</p>
                            {walletData?.loading && <p>Loading…</p>}
                            {walletData?.data && (
                                <JsonHighlighter data={walletData.data} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
