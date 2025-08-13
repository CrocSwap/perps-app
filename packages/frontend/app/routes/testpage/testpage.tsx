import PortfolioWithdraw from '~/components/Portfolio/PortfolioWithdraw/PortfolioWithdraw';
import styles from './testpage.module.css';
import TakeProfitsModal from '~/components/Trade/TakeProfitsModal/TakeProfitsModal';

export default function testpage() {
    return (
        <div className={styles.testpage}>
            <button>Open Limit Chase Modal</button>
        </div>
    );
}
