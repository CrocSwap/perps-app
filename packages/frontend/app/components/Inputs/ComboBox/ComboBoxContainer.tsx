import { useTradeDataStore } from '~/stores/TradeDataStore';
import styles from './ComboBox.module.css'
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useDebugStore } from '~/stores/DebugStore';
import ComboBox from './ComboBox';
import { debugWallets, wsEnvironments, wsUrls } from '~/utils/Constants';
export default function ComboBoxContainer() {
    const { symbol, selectedCurrency, setSelectedCurrency } =
        useTradeDataStore();
    const symbolRef = useRef(symbol);
    symbolRef.current = symbol;
    const { orderBookMode } = useAppSettings();
    const { marketId } = useParams<{ marketId: string }>();
    const navigate = useNavigate();
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
    } = useDebugStore();

    // useEffect(() => {
    //     const info = new Info({ environment: 'mock' });
    //     console.log({ wsManager: info.wsManager });
    // }, []);

    const currencies = ['USD', 'BTC', 'ETH'];
    

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
            className={`${styles.sdkToggle} ${sdkEnabled ? styles.active : styles.disabled}`}
            onClick={() => setSdkEnabled(!sdkEnabled)}
        >
            <div className={styles.sdkToggleButton}>
                {sdkEnabled ? 'SDK' : 'SDK'}
            </div>
            </div>
            </section>

    )
}