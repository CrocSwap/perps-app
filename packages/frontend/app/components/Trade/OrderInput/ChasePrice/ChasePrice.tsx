import OrderDropdown from '../OrderDropdown/OrderDropdown';
import type { ChaseOption } from '../OrderInput';
import styles from './ChasePrice.module.css';

interface PropsIF {
    chaseOptionTypes: ChaseOption[];
    chaseOption: string;
    handleChaseOptionChange: (value: string) => void;
}
export default function ChasePrice(props: PropsIF) {
    const { chaseOptionTypes, chaseOption, handleChaseOptionChange } = props;

    return (
        <div className={styles.chasePriceContainer}>
            <h3>Chase Price</h3>
            <OrderDropdown
                options={chaseOptionTypes}
                value={chaseOption}
                onChange={handleChaseOptionChange}
            />
        </div>
    );
}
