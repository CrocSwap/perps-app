import { useEffect, useState } from 'react';
import LineChart from '~/components/LineChart/LineChart';
import { useInfoApi } from '~/hooks/useInfoApi';
import { useDebugStore } from '~/stores/DebugStore';
import type { UserPositionIF } from '~/utils/UserDataIFs';
import CollateralPieChart from '../CollateralChart/CollateralPieChart';

export interface TabChartContext {
    activeTab: string;
    selectedVault: { label: string; value: string };
    selectedPeriod: { label: string; value: string };
    isLineDataFetched: boolean;
    handleLineDataFetched: (isDataFetched: boolean) => void;
    pnlHistory: { time: number; value: number }[] | undefined;
    setPnlHistory: React.Dispatch<
        React.SetStateAction<{ time: number; value: number }[] | undefined>
    >;
    accountValueHistory: { time: number; value: number }[] | undefined;
    setAccountValueHistory: React.Dispatch<
        React.SetStateAction<{ time: number; value: number }[] | undefined>
    >;
    userProfileLineData: any;
    setUserProfileLineData: React.Dispatch<React.SetStateAction<any>>;
}

const TabChartContext: React.FC<TabChartContext> = (props) => {
    const {
        activeTab,
        selectedVault,
        selectedPeriod,
        isLineDataFetched,
        handleLineDataFetched,
        pnlHistory,
        setPnlHistory,
        accountValueHistory,
        setAccountValueHistory,
        userProfileLineData,
        setUserProfileLineData,
    } = props;

    const { debugWallet } = useDebugStore();

    const { fetchUserPortfolio } = useInfoApi();

    const [parsedKey, setParsedKey] = useState<string>();
    const [chartWidth, setChartWidth] = useState<number>(850);
    const [chartHeight, setChartHeight] = useState<number>(250);

    const parseUserProfileData = (data: any, key: string) => {
        const userPositionData = data.get(key) as UserPositionIF;

        if (userPositionData.accountValueHistory) {
            const accountValueHistory =
                userPositionData.accountValueHistory.map((accountValue) => {
                    return {
                        time: accountValue[0],
                        value: Number(accountValue[1]),
                    };
                });

            setAccountValueHistory(() => accountValueHistory);
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

        setParsedKey(() => key);
    };

    useEffect(() => {
        if (debugWallet.address && !isLineDataFetched) {
            fetchUserPortfolio(debugWallet.address).then((data) => {
                setUserProfileLineData(() => data);

                handleLineDataFetched(true);
            });
        }
    }, [debugWallet.address, isLineDataFetched]);

    useEffect(() => {
        const key =
            selectedVault.value === 'perp'
                ? 'perp' + selectedPeriod.value
                : selectedPeriod.value === 'AllTime'
                  ? 'allTime'
                  : selectedPeriod.value?.toLowerCase();

        if (key !== parsedKey && userProfileLineData) {
            parseUserProfileData(userProfileLineData, key);
        }
    }, [
        userProfileLineData,
        selectedVault.value,
        selectedPeriod.value,
        activeTab,
    ]);

    window.addEventListener('resize', () => {
        const height = window.innerHeight;
        const width = window.innerWidth;
        if (height < 870) {
            setChartHeight(() => Math.max(250 - (870 - height), 100));
        } else {
            setChartHeight(() => 250);
        }

        if (width < 1250) {
            setChartWidth(() => Math.max(850 - (1250 - width), 250));
        }
    });

    return (
        <>
            {activeTab === 'Performance' && pnlHistory && (
                <LineChart
                    lineData={pnlHistory}
                    curve={'step'}
                    chartName={selectedVault.value + selectedPeriod.value}
                    height={chartHeight}
                    width={chartWidth}
                />
            )}

            {activeTab === 'Account Value' && accountValueHistory && (
                <LineChart
                    lineData={accountValueHistory}
                    curve={'step'}
                    chartName={selectedVault.value + selectedPeriod.value}
                    height={chartHeight}
                    width={chartWidth}
                />
            )}

            {activeTab === 'Collateral' && <CollateralPieChart />}
        </>
    );
};

export default TabChartContext;
