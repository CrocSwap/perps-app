import { AiOutlineQuestionCircle } from 'react-icons/ai';
import ToggleSwitch from '../../ToggleSwitch/ToggleSwitch';
import styles from './ReduceAndProfitToggle.module.css';
import Tooltip from '~/components/Tooltip/Tooltip';

interface PropsIF {
    isReduceOnlyEnabled: boolean;
    isTakeProfitEnabled: boolean;
    isRandomizeEnabled: boolean;
    isChasingIntervalEnabled: boolean;
    handleToggleReduceOnly: (newState?: boolean) => void;
    handleToggleProfitOnly: (newState?: boolean) => void;
    handleToggleRandomize: (newState?: boolean) => void;
    handleToggleIsChasingInterval: (newState?: boolean) => void;
    marketOrderType: string;
}
export default function ReduceAndProfitToggle(props: PropsIF) {
    const {
        isReduceOnlyEnabled,
        isTakeProfitEnabled,
        handleToggleReduceOnly,
        handleToggleProfitOnly,
        marketOrderType,
        isRandomizeEnabled,
        handleToggleRandomize,
        isChasingIntervalEnabled,
        handleToggleIsChasingInterval
    } = props;

    const showTakeProfitToggle = ['market', 'limit'].includes(marketOrderType);
    const showReduceToggle = marketOrderType !== 'chase_limit'

    const showRandomizeToggle = marketOrderType === 'twap';

    const chasingIntervalToggle = marketOrderType === 'chase_limit' &&(
        <div className={styles.chasingIntervalContainer}>
            <div className={styles.inputDetailsDataContent}>
                <div className={styles.inputDetailsLabel}>
                    <span>Chasing Interval</span>
                    <Tooltip content={'chasing interval'} position='right'>
                        <AiOutlineQuestionCircle size={13} />
                    </Tooltip>
                </div>
                <span className={styles.inputDetailValue}>Per 1s</span>
            </div>

            <div className={styles.reduceToggleContent}>
                <ToggleSwitch
                    isOn={isChasingIntervalEnabled}
                    onToggle={handleToggleIsChasingInterval}
                    label=''
                />
                <h3 className={styles.toggleLabel}>Max Chase Distance</h3>
            </div>
        </div>
    );

    return (
        <div className={styles.reduceToggleContainer}>
            {showRandomizeToggle && (
                <div className={styles.reduceToggleContent}>
                    <ToggleSwitch
                        isOn={isRandomizeEnabled}
                        onToggle={handleToggleRandomize}
                        label=''
                    />
                    <h3 className={styles.toggleLabel}>Randomize</h3>
                </div>
            )}
       {showReduceToggle &&     <div className={styles.reduceToggleContent}>
                <ToggleSwitch
                    isOn={isReduceOnlyEnabled}
                    onToggle={handleToggleReduceOnly}
                    label=''
                />
                <h3 className={styles.toggleLabel}>Reduce Only</h3>
            </div>}
            {showTakeProfitToggle && (
                <div className={styles.reduceToggleContent}>
                    <ToggleSwitch
                        isOn={isTakeProfitEnabled}
                        onToggle={handleToggleProfitOnly}
                        label=''
                    />
                    <h3 className={styles.toggleLabel}>
                        Take Profit / Stop Loss
                    </h3>
                </div>
            )}
            {chasingIntervalToggle}
        </div>
    );
}
