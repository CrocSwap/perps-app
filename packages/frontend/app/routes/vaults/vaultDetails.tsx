import { useEffect, useState, useCallback } from 'react';
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
import SkeletonNode from '~/components/Skeletons/SkeletonNode/SkeletonNode';
import ChartSkeleton from '~/components/Skeletons/ChartSkeleton/ChartSkeleton';
import { motion } from 'framer-motion';
import { useVaultManager } from './useVaultManager';
import Modal from '~/components/Modal/Modal';
import DepositModal from '~/components/Vault/DepositModal/DepositModal';
import WithdrawModal from '~/components/Vault/WithdrawModal/WithdrawModal';

export default function VaultDetails() {
    const { vaultAddress } = useParams<{ vaultAddress: string }>();
    const { setDebugWallet } = useDebugStore();
    const { fetchVaultDetails } = useInfoApi();

    const { formatNum } = useNumFormatter();

    const [vaultDetails, setVaultDetails] = useState<VaultDetailsIF | null>(
        null,
    );

    const skeletonHeight = 40;

    const navigate = useNavigate();

    const { getBsColor } = useAppSettings();

    const {
        selectedVault,
        modalOpen,
        modalContent,
        depositToVault,
        withdrawFromVault,
        processDeposit,
        processWithdraw,
        closeModal,
        assignSelectedVault,
    } = useVaultManager();

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

    useEffect(() => {
        if (vaultDetails) {
            assignSelectedVault(vaultDetails);
        }
    }, [vaultDetails]);

    const onWithdraw = () => {
        if (vaultDetails?.vaultAddress) {
            withdrawFromVault(vaultDetails.vaultAddress);
        }
    };

    const onDeposit = () => {
        if (vaultDetails?.vaultAddress) {
            depositToVault(vaultDetails.vaultAddress);
        }
    };

    const renderContent = useCallback(
        (content?: string | number, height?: number, width?: number) => {
            if (content) {
                return (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        {content}
                    </motion.div>
                );
            } else {
                return (
                    <SkeletonNode
                        nodeStyle={{
                            height: height ? height + 'px' : '20px',
                            width: width ? width + 'px' : '400px',
                        }}
                    />
                );
            }
        },
        [],
    );

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
                    <header>
                        {renderContent(vaultDetails?.name, skeletonHeight, 400)}
                    </header>
                    <div className={styles.headerRightContent}>
                        <SimpleButton
                            onClick={onWithdraw}
                            bg='dark3'
                            hoverBg='accent1'
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
                            {renderContent(
                                vaultDetails?.tvl
                                    ? formatNum(vaultDetails.tvl, 0, true, true)
                                    : undefined,
                                skeletonHeight,
                                200,
                            )}
                        </div>
                    </div>
                    <div className={styles.vaultCard}>
                        <div className={styles.vaultCardTitle}>
                            Past Month Return
                        </div>
                        <div className={styles.vaultCardContent}>
                            {vaultDetails ? (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    transition={{
                                        duration: 0.2,
                                        ease: 'easeInOut',
                                    }}
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
                                </motion.div>
                            ) : (
                                <>
                                    {renderContent(
                                        undefined,
                                        skeletonHeight,
                                        160,
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    <div className={styles.vaultCard}>
                        <div className={styles.vaultCardTitle}>
                            Vault Capacity
                        </div>
                        <div className={styles.vaultCardContent}>
                            {renderContent(
                                vaultDetails
                                    ? formatNum(10000000, 0, true, true)
                                    : undefined,
                                skeletonHeight,
                                200,
                            )}
                        </div>
                    </div>
                    <div className={styles.vaultCard}>
                        <div className={styles.vaultCardTitle}>
                            Your Deposits
                        </div>
                        <div className={styles.vaultCardContent}>
                            {renderContent(
                                vaultDetails
                                    ? formatNum(0, 0, true, true)
                                    : undefined,
                                skeletonHeight,
                                160,
                            )}
                        </div>
                    </div>
                    <div className={styles.vaultCard}>
                        <div className={styles.vaultCardTitle}>
                            All-time Earned
                        </div>
                        <div className={styles.vaultCardContent}>
                            {renderContent(
                                vaultDetails
                                    ? formatNum(0, 0, true, true)
                                    : undefined,
                                skeletonHeight,
                                160,
                            )}
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
                        {vaultDetails ? (
                            <VaultCharts info={vaultDetails} />
                        ) : (
                            <div className={styles.chartSkeletonWrapper}>
                                <ChartSkeleton />
                            </div>
                        )}
                    </div>
                </div>

                {vaultAddress && <WebDataConsumer />}
                <TradeTable vaultPage={true} />
            </div>

            {modalOpen && selectedVault && (
                <Modal
                    close={closeModal}
                    position='center'
                    title={modalContent === 'deposit' ? 'Deposit' : 'Withdraw'}
                >
                    {modalContent === 'deposit' && (
                        <DepositModal
                            vault={selectedVault}
                            onDeposit={processDeposit}
                            onClose={closeModal}
                        />
                    )}

                    {modalContent === 'withdraw' && (
                        <WithdrawModal
                            vault={selectedVault}
                            onWithdraw={processWithdraw}
                            onClose={closeModal}
                        />
                    )}
                </Modal>
            )}
        </>
    );
}
