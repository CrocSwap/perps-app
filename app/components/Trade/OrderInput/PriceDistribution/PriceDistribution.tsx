import Tooltip from '~/components/Tooltip/Tooltip';
import styles from './PriceDistribution.module.css';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
export default function PriceDistribution() {
    return (
        <div className={styles.container}>
            <div className={styles.inputDetailsLabel}>
                <span>Price Distribution</span>
                <Tooltip content={'price distribution'} position='right'>
                    <AiOutlineQuestionCircle size={13} />
                </Tooltip>
            </div>
            <div className={styles.actionButtonsContainer}>
                <button>
                    {flatSvg}
                    Flat
                </button>
                <button>
                    {evenSvg}
                    Evenly Split
                </button>
            </div>
        </div>
    );
}

const flatSvg = (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='25'
        height='25'
        viewBox='0 0 25 25'
        fill='none'
    >
        <path
            d='M4.5 18.7897H20.5'
            stroke='#BCBCC4'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
        />
        <path
            d='M4.5 12.7897H20.5'
            stroke='#BCBCC4'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
        />
        <path
            d='M4.5 6.78967H20.5'
            stroke='#7371FC'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
        />
    </svg>
);

const evenSvg = (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='24'
        height='25'
        viewBox='0 0 24 25'
        fill='none'
    >
        <path
            d='M4 12.7897H20M4 6.78967H20M4 18.7897H20'
            stroke='#BCBCC4'
            stroke-width='2'
            stroke-linecap='round'
            stroke-linejoin='round'
        />
    </svg>
);
