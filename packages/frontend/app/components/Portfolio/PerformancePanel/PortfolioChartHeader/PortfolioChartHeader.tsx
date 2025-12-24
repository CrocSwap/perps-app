import React, { useState } from 'react';
import styles from './PortfolioChartHeader.module.css';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';

type PortfolioHeaderIF = {
    selectedVault: { label: string; value: string };
    setSelectedVault: React.Dispatch<
        React.SetStateAction<{ label: string; value: string }>
    >;
    selectedPeriod: { label: string; value: string };
    setSelectedPeriod: React.Dispatch<
        React.SetStateAction<{ label: string; value: string }>
    >;
};

const PortfolioChartHeader: React.FC<PortfolioHeaderIF> = (props) => {
    const {
        selectedVault,
        setSelectedVault,
        selectedPeriod,
        setSelectedPeriod,
    } = props;

    const vaultOptions = [
        { label: 'Perps', value: 'perp' },
        { label: 'Perps + Vaults', value: 'all' },
    ];

    const periodOptions = [
        { label: '24H', value: 'Day' },
        { label: '7D', value: 'Week' },
        { label: '30D', value: 'Month' },
        { label: 'All-time', value: 'AllTime' },
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
