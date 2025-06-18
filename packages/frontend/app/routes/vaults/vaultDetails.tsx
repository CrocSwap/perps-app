import { useEffect, useState } from 'react';
import { FaChevronLeft } from 'react-icons/fa';
import { Link, useNavigate, useParams } from 'react-router';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import TradeTable from '~/components/Trade/TradeTables/TradeTables';
import { useInfoApi } from '~/hooks/useInfoApi';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useDebugStore } from '~/stores/DebugStore';
import type { VaultDetailsIF } from '~/utils/VaultIFs';
import WebDataConsumer from '../trade/webdataconsumer';
import VaultCharts from './vaultCharts';
import styles from './vaultDetails.module.css';
import VaultInfo from './vaultInfo';

export default function VaultDetails() {
    const { vaultAddress } = useParams<{ vaultAddress: string }>();
    const { setDebugWallet } = useDebugStore();
    const { fetchVaultDetails } = useInfoApi();

    const { formatNum } = useNumFormatter();

    const [vaultDetails, setVaultDetails] = useState<VaultDetailsIF | null>(
        null,
    );

    const navigate = useNavigate();

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

    const onWithdraw = () => {
        console.log('withdraw');
    };

    const onDeposit = () => {
        console.log('deposit');
    };

    return (
        <>
            <div className={styles.container}>
                <div className={styles.headerWrapper}>
                    <div
                        className={styles.backButton}
                        onClick={() => navigate('/vaults')}
                    >
                        <FaChevronLeft />
                    </div>
                    <header>{vaultDetails?.name}</header>
                    <div className={styles.headerRightContent}>
                        <SimpleButton
                            onClick={onWithdraw}
                            bg='dark3'
                            hoverBg='dark4'
                        >
                            Withdraw
                        </SimpleButton>
                        <SimpleButton onClick={onDeposit} bg='accent1'>
                            Deposit
                        </SimpleButton>
                    </div>
                </div>
                <div className={styles.vaultSection}>
                    <div className={styles.vaultCard}>
                        <div className={styles.vaultCardTitle}>TVL</div>
                        <div className={styles.vaultCardContent}>
                            {formatNum(vaultDetails?.tvl ?? 0, 0, true, true)}
                        </div>
                    </div>
                    <div className={styles.vaultCard}>
                        <div className={styles.vaultCardTitle}>
                            Past Month Return
                        </div>
                        <div className={styles.vaultCardContent}>
                            {vaultDetails && (
                                <div
                                    className={
                                        styles.vaultCardContent +
                                        ' ' +
                                        styles.vaultCardContentApr
                                    }
                                    style={{
                                        color:
                                            vaultDetails.apr > 0
                                                ? getBsColor().buy
                                                : vaultDetails.apr < 0
                                                  ? getBsColor().sell
                                                  : 'inherit',
                                    }}
                                >
                                    {vaultDetails.apr > 0 ? '+' : ''}
                                    {formatNum(vaultDetails.apr * 100, 2)}%{' '}
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
                <TradeTable vaultPage={true} />
            </div>
        </>
    );
}
