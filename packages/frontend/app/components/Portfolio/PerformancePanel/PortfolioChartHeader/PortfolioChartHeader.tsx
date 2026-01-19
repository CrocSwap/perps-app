import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import styles from './PortfolioChartHeader.module.css';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';

type PortfolioHeaderIF = {
    selectedVault: { label: string; value: string };
    setSelectedVault: React.Dispatch<
        React.SetStateAction<{ label: string; value: string }>
    >;
    selectedPeriod: { label: string; value: string; timeframe: number };
    setSelectedPeriod: React.Dispatch<
        React.SetStateAction<{
            label: string;
            value: string;
            timeframe: number;
        }>
    >;
};

const PortfolioChartHeader: React.FC<PortfolioHeaderIF> = (props) => {
    const { t } = useTranslation();
    const {
        selectedVault,
        setSelectedVault,
        selectedPeriod,
        setSelectedPeriod,
    } = props;

    const vaultOptions = [
        { label: t('portfolio.perps'), value: 'perp' },
        // { label: t('portfolio.perpsAndVaults'), value: 'all' },
    ];

    const periodOptions = [
        {
            label: t('portfolio.twentyFourHour'),
            value: 'Day',
            timeframe: 24 * 60 * 60 * 1000,
        },
        {
            label: t('portfolio.sevenDay'),
            value: 'Week',
            timeframe: 7 * 24 * 60 * 60 * 1000,
        },
        {
            label: t('portfolio.thirtyDay'),
            value: 'Month',
            timeframe: 30 * 24 * 60 * 60 * 1000,
        },
        { label: t('portfolio.allTime'), value: 'AllTime', timeframe: 0 },
    ];

    return (
        <div
            id={'portfolio-header-container'}
            className={styles.headercontainer}
        >
            <div className={styles.header}>
                <div className={styles.filterContainer}>
                    <div className={styles.vaultFilter}>
                        <ComboBox
                            value={selectedVault.label}
                            options={vaultOptions}
                            fieldName='label'
                            width='150px'
                            centered={true}
                            onChange={(value) =>
                                setSelectedVault({
                                    label: value,
                                    value:
                                        vaultOptions.find(
                                            (opt) => opt.label === value,
                                        )?.value || '',
                                })
                            }
                        />
                    </div>
                </div>

                <div className={styles.filterContainer}>
                    <div className={styles.vaultFilter}>
                        <ComboBox
                            value={selectedPeriod.label}
                            options={periodOptions}
                            fieldName='label'
                            width='150px'
                            centered={true}
                            onChange={(value) =>
                                setSelectedPeriod({
                                    label: value,
                                    value:
                                        periodOptions.find(
                                            (opt) => opt.label === value,
                                        )?.value || '',
                                    timeframe:
                                        periodOptions.find(
                                            (opt) => opt.label === value,
                                        )?.timeframe || 0,
                                })
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioChartHeader;
