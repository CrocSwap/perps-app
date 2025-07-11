import styles from './ConfirmationModal.module.css';
import Tooltip from '~/components/Tooltip/Tooltip';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import ToggleSwitch from '../../ToggleSwitch/ToggleSwitch';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import type { modalContentT } from '../OrderInput';

interface propsIF {
    tx: modalContentT;
    submitFn: () => void;
    size: {
        qty: string;
        denom: string;
    };
    limitPrice?: string;
    isEnabled: boolean;
    toggleEnabled: () => void;
}
type InfoItem = {
    label: string;
    value: string;
    tooltip?: string;
    className?: string;
};

export default function ConfirmationModal(props: propsIF) {
    const { submitFn, tx, isEnabled, toggleEnabled, size, limitPrice } = props;

    const dataInfo: InfoItem[] = [
        {
            label: 'Action',
            value: tx.includes('buy') ? 'Buy' : 'Sell',
            className: styles[tx.includes('buy') ? 'green' : 'red'],
        },
        {
            label: 'Size',
            value: `${size.qty || '--'} ${size.denom}`,
            className: styles[tx.includes('buy') ? 'green' : 'red'],
        },
        {
            label: 'Price',
            value: tx.includes('limit') ? limitPrice || '--' : 'Market',
            className: styles.white,
        },
        {
            label: 'Est. Liquidation Price',
            value: 'N/A',
            tooltip:
                'Estimated price at which your position will be liquidated',
            className: styles.white,
        },
        {
            label: 'Network Fee',
            value: '0.000001 FOGO',
            tooltip: 'Fee required to execute this trade on the network',
            className: styles.white,
        },
    ];

    return (
        <div className={styles.container}>
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
                    isOn={!isEnabled}
                    onToggle={toggleEnabled}
                    label={"Don't show this again"}
                    // reverse
                />
            </div>
            <SimpleButton
                bg='accent1'
                onClick={submitFn}
                style={{ height: '47px' }}
            >
                {tx.includes('buy') ? 'Buy / Long' : 'Sell / Short'}
            </SimpleButton>
        </div>
    );
}
