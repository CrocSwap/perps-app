import { MdClose } from 'react-icons/md';
import styles from './ConfirmationModal.module.css';
import Tooltip from '~/components/Tooltip/Tooltip';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import ToggleSwitch from '../../ToggleSwitch/ToggleSwitch';
import { useState } from 'react';

interface PropsIF {
    onClose: () => void;
}
type InfoItem = {
    label: string;
    value: string;
    tooltip?: string;
    className?: string;
};

const dataInfo: InfoItem[] = [
    {
        label: 'Action',
        value: 'Buy',
        className: styles.green,
    },
    {
        label: 'Size',
        value: '0.0001 ETH',
        className: styles.green,
    },
    {
        label: 'Price',
        value: 'Market',
        className: styles.white,
    },
    {
        label: 'Est. Liquidation Price',
        value: 'N/A',
        tooltip: 'Estimated price at which your position will be liquidated',
        className: styles.white,
    },
    {
        label: 'Network Fee',
        value: '0.000001 FOGO',
        tooltip: 'Fee required to execute this trade on the network',
        className: styles.white,
    },
];

export default function ConfirmationModal(props: PropsIF) {
    const { onClose } = props;
    const [isDontShowEnabled, setIsDontShowEnabled] = useState(false);
    return (
        <div className={styles.container}>
            <header>
                <span />
                <h3>Confirm Order</h3>
                <MdClose onClick={onClose} />
            </header>

            <div className={styles.contentContainer}>
                {dataInfo.map((info) => (
                    <div className={styles.infoRow}>
                        <div className={styles.infoLabel}>
                            {info.label}
                            {info?.tooltip && (
                                <Tooltip
                                    content={info?.tooltip}
                                    position='right'
                                >
                                    <AiOutlineQuestionCircle size={13} />
                                </Tooltip>
                            )}
                        </div>
                        <div
                            className={`${styles.infoValue} ${
                                info?.className && info.className
                            }`}
                        >
                            {info.value}
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.toggleContainer}>
                <ToggleSwitch
                    isOn={isDontShowEnabled}
                    onToggle={() => setIsDontShowEnabled(!isDontShowEnabled)}
                    label={"Don't show this again"}
                    // reverse
                />
            </div>
            <button className={styles.confirmButton} onClick={onClose}>
                Buy/Long
            </button>
        </div>
    );
}
