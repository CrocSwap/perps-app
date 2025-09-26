import { t } from 'i18next';
import styles from './PriceRange.module.css';

interface PropsIF {
    minValue: string;
    maxValue: string;
    handleChangeMin: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleChangeMax: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onBlurMin?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onBlurMax?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDownMin?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    onKeyDownMax?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    classNameMin?: string;
    classNameMax?: string;
    ariaLabelMin?: string;
    ariaLabelMax?: string;

    totalOrders: string;
    handleChangetotalOrders: (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => void;
}

export default function PriceRange(props: PropsIF) {
    const {
        minValue,
        maxValue,
        handleChangeMin,
        handleChangeMax,
        onBlurMin,
        onBlurMax,
        onKeyDownMin,
        onKeyDownMax,
        classNameMin,
        classNameMax,
        ariaLabelMin,
        ariaLabelMax,
        totalOrders,
        handleChangetotalOrders,
    } = props;

    return (
        <div className={styles.container}>
            <h3 className={styles.label}>Price Range</h3>

            <div className={styles.inputsContainer}>
                <input
                    type='text'
                    value={minValue}
                    onChange={handleChangeMin}
                    onBlur={onBlurMin}
                    onKeyDown={onKeyDownMin}
                    className={classNameMin}
                    aria-label={ariaLabelMin}
                    inputMode='numeric'
                    pattern='[0-9]*'
                    placeholder='Enter Min'
                />
                <span className={styles.seperator}>-</span>
                <input
                    type='text'
                    value={maxValue}
                    onChange={handleChangeMax}
                    onBlur={onBlurMax}
                    onKeyDown={onKeyDownMax}
                    className={classNameMax}
                    aria-label={ariaLabelMax}
                    inputMode='decimal'
                    placeholder='Enter Max'
                />
            </div>
            <input
                type='text'
                value={totalOrders}
                onChange={handleChangetotalOrders}
                aria-label={t('aria.totalOrders')}
                pattern='[0-9]*\.?[0-9]*'
                placeholder='Total Orders'
                className={styles.totalOrdersInput}
            />
        </div>
    );
}
