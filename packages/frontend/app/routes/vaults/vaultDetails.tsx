import { useParams } from 'react-router';
import styles from './vaultDetails.module.css';
import { useEffect, useState } from 'react';
import { useDebugStore } from '~/stores/DebugStore';
import WebDataConsumer from '../trade/webdataconsumer';
import TradeTable from '~/components/Trade/TradeTables/TradeTables';
import { useInfoApi } from '~/hooks/useInfoApi';
import useNumFormatter from '~/hooks/useNumFormatter';
import type { VaultDetailsIF } from '~/utils/VaultIFs';
import VaultInfo from './vaultInfo';
import VaultCharts from './vaultCharts';
import { useAppSettings } from '~/stores/AppSettingsStore';

export default function VaultDetails() {
    const { vaultAddress } = useParams<{ vaultAddress: string }>();
    const { setDebugWallet } = useDebugStore();
    const { fetchVaultDetails } = useInfoApi();

    const { formatNum } = useNumFormatter();

    const [vaultDetails, setVaultDetails] = useState<VaultDetailsIF | null>(
        null,
    );

    const { getBsColor } = useAppSettings();

    useEffect(() => {
        const fetch = async () => {
            if (vaultAddress) {
                const vaultDetails = await fetchVaultDetails(
                    '0x0000000000000000000000000000000000000000',
                    vaultAddress,
                );
                setVaultDetails(vaultDetails);
            }
        };
        fetch();
    }, [vaultAddress]);

    useEffect(() => {
        if (vaultAddress) {
            setDebugWallet({
                address: vaultAddress,
                label: 'Vault',
            });
        }
    }, [vaultAddress]);

    return (
        <>
            <div className={styles.container}>
                <header>{vaultDetails?.name}</header>
                <div className={styles.vaultSection}>
                    <div className={styles.vaultCard}>
                        <div className={styles.vaultCardTitle}>TVL</div>
                        <div className={styles.vaultCardContent}>
                            {formatNum(1280000, 0, true, true)}
                        </div>
                    </div>
                    <div className={styles.vaultCard}>
                        <div className={styles.vaultCardTitle}>
                            Past Month Return
                        </div>
                        <div className={styles.vaultCardContent}>
                            {vaultDetails && (
                                <div
                                    className={styles.vaultCardContent}
                                    style={{
                                        color:
                                            vaultDetails.apr > 0
                                                ? getBsColor().buy
                                                : vaultDetails.apr < 0
                                                  ? getBsColor().sell
                                                  : 'inherit',
                                    }}
                                >
                                    {formatNum(vaultDetails.apr * 100, 2)}%{' '}
                                    <span
                                        className={styles.aprLabel}
                                        style={{
                                            backgroundColor:
                                                vaultDetails.apr > 0
                                                    ? `color-mix(in srgb, ${getBsColor().buy} 20%, transparent )`
                                                    : `color-mix(in srgb, ${getBsColor().sell} 20%, transparent )`,
                                        }}
                                    >
                                        APR
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.vaultCard}>
                        <div className={styles.vaultCardTitle}>
                            Vault Capacity
                        </div>
                        <div className={styles.vaultCardContent}>
                            {formatNum(10000000, 0, true, true)}
                        </div>
                    </div>
                    <div className={styles.vaultCard}>
                        <div className={styles.vaultCardTitle}>
                            Your Deposits
                        </div>
                        <div className={styles.vaultCardContent}>
                            {formatNum(0, 0, true, true)}
                        </div>
                    </div>
                    <div className={styles.vaultCard}>
                        <div className={styles.vaultCardTitle}>
                            All-time Earned
                        </div>
                        <div className={styles.vaultCardContent}>
                            {formatNum(0, 0, true, true)}
                        </div>
                    </div>
                </div>
                <div className={styles.vaultSection}>
                    <div
                        className={styles.vaultCard + ' ' + styles.zeroPadding}
                    >
                        <VaultInfo info={vaultDetails} />
                    </div>
                    <div
                        className={styles.vaultCard + ' ' + styles.zeroPadding}
                    >
                        <VaultCharts info={vaultDetails} />
                    </div>
                </div>

                {vaultAddress && <WebDataConsumer />}
                <TradeTable />
            </div>
        </>
    );
}
