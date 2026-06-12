import OrderDropdown from '../OrderDropdown/OrderDropdown';
import styles from './ChasePrice.module.css';

interface ChaseOption {
    value: string;
    label: string;
}

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
