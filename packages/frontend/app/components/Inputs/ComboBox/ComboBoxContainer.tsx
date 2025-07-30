import { instructions } from '@crocswap-libs/ambient-ember';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { useRef } from 'react';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { debugWallets, wsEnvironments, wsUrls } from '~/utils/Constants';
import ComboBox from './ComboBox';
import styles from './ComboBox.module.css';
export default function ComboBoxContainer() {
    const { symbol, selectedCurrency, setSelectedCurrency } =
        useTradeDataStore();
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
        pauseLiqAnimation,
        setPauseLiqAnimation,
    } = useDebugStore();

    // useEffect(() => {
    //     const info = new Info({ environment: 'mock' });
    //     console.log({ wsManager: info.wsManager });
    // }, []);

    const currencies = ['USD', 'BTC', 'ETH'];

    const sessionState = useSession();

    return (
        <section className={styles.comboBoxContainers}>
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
            <div className={styles.walletSelector}>
                <ComboBox
                    value={debugWallet.label}
                    options={debugWallets}
                    fieldName='label'
                    onChange={(value) =>
                        setDebugWallet({
                            label: value,
                            address:
                                debugWallets.find(
                                    (wallet) => wallet.label === value,
                                )?.address || '',
                        })
                    }
                />
            </div>

            <div className={styles.currencySelector}>
                <ComboBox
                    value={selectedCurrency}
                    options={currencies}
                    onChange={(value) => setSelectedCurrency(value)}
                />
            </div>

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
                className={`${styles.wsToggle} ${pauseLiqAnimation ? styles.wsToggleRunning : styles.wsTogglePaused}`}
                onClick={() => setPauseLiqAnimation(!pauseLiqAnimation)}
            >
                <div className={styles.wsToggleButton}>
                    {pauseLiqAnimation ? 'Pause Liq' : 'Pause Liq'}
                </div>
            </div>
            {isEstablished(sessionState) && (
                <button
                    onClick={() => {
                        (async () => {
                            if (isEstablished(sessionState)) {
                                console.log('established');
                                const userWalletKey =
                                    sessionState.walletPublicKey ||
                                    sessionState.sessionPublicKey;
                                const ix = instructions.pingIx(42n, {
                                    actor: sessionState.sessionPublicKey,
                                    target: userWalletKey,
                                });
                                console.log({ ix, sessionState });
                                const result =
                                    await sessionState.sendTransaction([ix]);
                                console.log({ result });
                            }
                        })();
                    }}
                >
                    Ping
                </button>
            )}
        </section>
    );
}
