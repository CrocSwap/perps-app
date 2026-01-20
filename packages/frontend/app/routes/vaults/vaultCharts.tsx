import type {
    VaultDetailsIF,
    VaultPortfolioHistoryIF,
    VaultPortfolioIF,
} from '~/utils/VaultIFs';
import styles from './vaultCharts.module.css';
import { useEffect, useState } from 'react';
import { useCallback } from 'react';
import Tabs from '~/components/Tabs/Tabs';
import { motion } from 'framer-motion';
import LineChart from '~/components/LineChart/LineChart';
import type { UserPositionIF } from '~/utils/UserDataIFs';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
interface VaultChartsProps {
    info: VaultDetailsIF | null;
}

export default function VaultCharts({ info }: VaultChartsProps) {
    const infoTabs = ['Vault Value', 'Vault PnL'];
    const [tab, setTab] = useState(infoTabs[0]);

    const [vaultHistory, setVaultHistory] = useState<
        { time: number; value: number }[] | undefined
    >();

    const [pnlHistory, setPnlHistory] = useState<
        { time: number; value: number }[] | undefined
    >();

    const [chartWidth] = useState<number>(
        document.getElementById('chartPlaceholder')?.clientWidth || 590,
    );

    // const [chartHeight] = useState<number>(
    //     document.getElementById('chartPlaceholder')?.clientHeight || 250,
    // );

    const periodOptions = [
        { label: '24H', value: 0, timeframe: 24 * 60 * 60 * 1000 },
        { label: '7D', value: 1, timeframe: 7 * 24 * 60 * 60 * 1000 },
        { label: '30D', value: 2, timeframe: 30 * 24 * 60 * 60 * 1000 },
        { label: 'All-time', value: 3, timeframe: 0 },
    ];

    const [selectedPeriod, setSelectedPeriod] = useState<{
        label: string;
        value: number;
        timeframe: number;
    }>({ label: 'All-time', value: 3, timeframe: 0 });

    const parseUserProfileData = (data: VaultPortfolioIF, key: number) => {
        const userPositionData = data[key][1] as VaultPortfolioHistoryIF;

        if (userPositionData.accountValueHistory) {
            const accountValueHistory =
                userPositionData.accountValueHistory.map((accountValue) => {
                    return {
                        time: accountValue[0],
                        value: Number(accountValue[1]),
                    };
                });

            setVaultHistory(() => accountValueHistory);
        }

        if (userPositionData.pnlHistory) {
            const pnlHistory = userPositionData.pnlHistory.map((pnlValue) => {
                return {
                    time: pnlValue[0],
                    value: Number(pnlValue[1]),
                };
            });

            setPnlHistory(() => pnlHistory);
        }
    };

    useEffect(() => {
        if (info && selectedPeriod) {
            parseUserProfileData(info?.portfolio, selectedPeriod.value);
        }
    }, [info, selectedPeriod]);

    const renderTabContent = useCallback(() => {
        switch (tab) {
            case 'Vault Value':
                return (
                    <div
                        id={'chartPlaceholder'}
                        className={styles.chartPlaceholder}
                    >
                        {vaultHistory && (
                            <LineChart
                                lineData={vaultHistory}
                                curve={'step'}
                                chartName={'vaultChart' + selectedPeriod.value}
                                height={180}
                                width={chartWidth}
                            />
                        )}
                    </div>
                );
            case 'Vault PnL':
                return (
                    <div className={styles.chartPlaceholder}>
                        {pnlHistory && (
                            <LineChart
                                lineData={pnlHistory}
                                curve={'step'}
                                chartName={'pnlChart' + selectedPeriod.value}
                                height={180}
                                width={chartWidth}
                            />
                        )}
                    </div>
                );
            default:
                return <div>About</div>;
        }
    }, [tab, vaultHistory, pnlHistory, selectedPeriod]);

    const filterDropdown = (
        <div className={styles.filterContainer}>
            <div className={styles.vaultFilter}>
                <ComboBox
                    value={selectedPeriod.label}
                    options={periodOptions}
                    fieldName='label'
                    onChange={(value) =>
                        setSelectedPeriod({
                            label: value,
                            value:
                                periodOptions.find((opt) => opt.label === value)
                                    ?.value ?? 3,
                            timeframe:
                                periodOptions.find((opt) => opt.label === value)
                                    ?.timeframe ?? 0,
                        })
                    }
                />
            </div>
        </div>
    );

    return (
        <>
            <div className={styles.chartHeader}>
                <Tabs tabs={infoTabs} defaultTab={tab} onTabChange={setTab} />
                {filterDropdown}
            </div>
            <motion.div
                key={tab}
                className={styles.content}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {renderTabContent()}
            </motion.div>
        </>
    );
}
