import { instructions } from '@crocswap-libs/ambient-ember';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
} from 'react';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { debugWallets, wsEnvironments, wsUrls } from '~/utils/Constants';
import ComboBox from './ComboBox';
import styles from './ComboBox.module.css';
import Tooltip from '~/components/Tooltip/Tooltip';
import { PublicKey } from '@solana/web3.js';
import { HorizontalScrollable } from '~/components/Wrappers/HorizontanScrollable/HorizontalScrollable';

export default function ComboBoxContainer() {
    const { symbol, selectedCurrency, setSelectedCurrency } =
        useTradeDataStore();
    const { userAddress } = useUserDataStore();
    const symbolRef = useRef(symbol);
    symbolRef.current = symbol;
    const {
        wsUrl,
        setWsUrl,
        debugWallet,
        setDebugWallet,
        isWsEnabled,
        setIsWsEnabled,
        wsEnvironment,
        setWsEnvironment,
        sdkEnabled,
        setSdkEnabled,
        isWsSleepMode,
        setIsWsSleepMode,
        isDebugWalletActive,
        setIsDebugWalletActive,
        usePythOracle,
        setUsePythOracle,
        manualAddressEnabled,
        setManualAddressEnabled,
        manualAddress,
        setManualAddress,
        useMockLeverage,
        setUseMockLeverage,
        mockMinimumLeverage,
        setMockMinimumLeverage,
    } = useDebugStore();

    const currencies = ['USD', 'BTC', 'ETH'];

    const sessionState = useSession();
    const [validManualAddress, setValidManualAddress] = useState(false);
    const [addressInputVal, setAddressInputVal] = useState('');

    const manualAddressInputKeyListener = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setManualAddressEnabled(false);
                setManualAddress('');
                setAddressInputVal('');
            }
        },
        [setManualAddressEnabled, setManualAddress],
    );

    const manualAddressInputChangeListener = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            try {
                new PublicKey(val);
                setValidManualAddress(true);
                setManualAddress(e.target.value);
            } catch (e) {
                if (val === '' || val === undefined) {
                    setManualAddress('');
                } else {
                    setValidManualAddress(false);
                }
            }
            setAddressInputVal(e.target.value);
        },
        [setManualAddress],
    );

    useEffect(() => {
        setAddressInputVal('');
    }, [isDebugWalletActive]);

    return (
        <section className={styles.comboBoxContainers}>
            <div id={'debug-wallet-static-area'} className={styles.itemWrapper}>
                <div className={styles.wsUrlSelector}>
                    {sdkEnabled ? (
                        <ComboBox
                            value={wsEnvironment}
                            options={wsEnvironments}
                            fieldName='value'
                            onChange={(value) => setWsEnvironment(value)}
                        />
                    ) : (
                        <ComboBox
                            value={wsUrl}
                            options={wsUrls}
                            onChange={(value) => setWsUrl(value)}
                        />
                    )}
                </div>

                <div
                    className={`${styles.sdkToggle} ${useMockLeverage ? styles.active : styles.disabled}`}
                    onClick={() => setUseMockLeverage(!useMockLeverage)}
                >
                    <div className={styles.sdkToggleButton}>Lev</div>
                </div>

                {useMockLeverage && (
                    <div>
                        <input
                            type='number'
                            value={mockMinimumLeverage}
                            onChange={(e) =>
                                setMockMinimumLeverage(
                                    parseFloat(e.target.value) || 1,
                                )
                            }
                            step='0.1'
                            min='1'
                            max='100'
                        />
                    </div>
                )}

                <div className={styles.currencySelector}>
                    <ComboBox
                        value={selectedCurrency}
                        options={currencies}
                        onChange={(value) => setSelectedCurrency(value)}
                    />
                </div>
                <div className={styles.divider} />
            </div>

            <HorizontalScrollable
                excludes={['debug-wallet-static-area']}
                wrapperId='trade-page-left-section'
                offset={20}
            >
                <div className={styles.itemWrapper}>
                    <div
                        className={`${styles.wsToggle} ${isWsEnabled ? styles.wsToggleRunning : styles.wsTogglePaused}`}
                        onClick={() => setIsWsEnabled(!isWsEnabled)}
                    >
                        <div className={styles.wsToggleButton}>
                            {' '}
                            {isWsEnabled ? 'WS' : 'WS'}
                        </div>
                    </div>
                    <div
                        className={`${styles.wsToggle} ${isWsSleepMode ? styles.wsToggleRunning : styles.wsTogglePaused}`}
                        onClick={() => setIsWsSleepMode(!isWsSleepMode)}
                    >
                        <div className={styles.wsToggleButton}>
                            {isWsSleepMode ? 'WS Sleep' : 'WS Sleep'}
                        </div>
                    </div>
                    <div
                        className={`${styles.sdkToggle} ${sdkEnabled ? styles.active : styles.disabled}`}
                        onClick={() => setSdkEnabled(!sdkEnabled)}
                    >
                        <div className={styles.sdkToggleButton}>
                            {sdkEnabled ? 'SDK' : 'SDK'}
                        </div>
                    </div>
                    <div
                        className={`${styles.sdkToggle} ${usePythOracle ? styles.active : styles.disabled}`}
                        onClick={() => setUsePythOracle(!usePythOracle)}
                    >
                        <div className={styles.sdkToggleButton}>
                            {usePythOracle ? 'Pyth' : 'HL'} Oracle
                        </div>
                    </div>

                    <div className={styles.divider} />

                    <div
                        className={`${styles.sdkToggle} ${isDebugWalletActive ? styles.active : styles.disabled}`}
                        onClick={() =>
                            setIsDebugWalletActive(!isDebugWalletActive)
                        }
                    >
                        <Tooltip
                            content={`${isDebugWalletActive ? 'HyperLiquid data is being used' : userAddress}`}
                        >
                            <div className={styles.sdkToggleButton}>
                                {isDebugWalletActive
                                    ? 'Debug Wallet'
                                    : 'Sessions Wallet'}
                            </div>
                        </Tooltip>
                    </div>
                    {isDebugWalletActive ? (
                        <div
                            className={`${styles.walletSelector} ${!isDebugWalletActive ? styles.passive : ' '}`}
                        >
                            <ComboBox
                                value={debugWallet.label}
                                options={debugWallets}
                                fieldName='label'
                                onChange={(value) =>
                                    setDebugWallet({
                                        label: value,
                                        address:
                                            debugWallets.find(
                                                (wallet) =>
                                                    wallet.label === value,
                                            )?.address || '',
                                    })
                                }
                                cssPositioning='fixed'
                            />
                        </div>
                    ) : (
                        <div className={styles.addressSection}>
                            {manualAddressEnabled ? (
                                <>
                                    <input
                                        className={`${styles.manualAddressInput}
                                ${addressInputVal && addressInputVal.length > 0 ? (validManualAddress ? styles.valid : styles.invalid) : ''}
                                `}
                                        type='text'
                                        value={addressInputVal}
                                        onChange={
                                            manualAddressInputChangeListener
                                        }
                                        onKeyDown={
                                            manualAddressInputKeyListener
                                        }
                                        autoFocus
                                    />
                                </>
                            ) : (
                                <Tooltip content='Double click to edit'>
                                    <div
                                        onDoubleClick={() =>
                                            setManualAddressEnabled(true)
                                        }
                                        className={styles.subInfo}
                                    >
                                        {userAddress && userAddress.length > 0
                                            ? userAddress
                                            : 'Double click to add address manually'}
                                    </div>
                                </Tooltip>
                            )}
                        </div>
                    )}

                    <div className={styles.divider} />
                    {isEstablished(sessionState) && (
                        <div>
                            <button
                                onClick={() => {
                                    (async () => {
                                        if (isEstablished(sessionState)) {
                                            console.log('established');
                                            const userWalletKey =
                                                sessionState.walletPublicKey ||
                                                sessionState.sessionPublicKey;
                                            const ix = instructions.pingIx(
                                                42n,
                                                {
                                                    actor: sessionState.sessionPublicKey,
                                                    target: userWalletKey,
                                                },
                                            );
                                            console.log({ ix, sessionState });
                                            const result =
                                                await sessionState.sendTransaction(
                                                    [ix],
                                                );
                                            console.log({ result });
                                        }
                                    })();
                                }}
                            >
                                Ping
                            </button>
                        </div>
                    )}
                </div>
            </HorizontalScrollable>
        </section>
    );
}
