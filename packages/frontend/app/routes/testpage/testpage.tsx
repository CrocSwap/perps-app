import PortfolioWithdraw from '~/components/Portfolio/PortfolioWithdraw/PortfolioWithdraw';
import styles from './testpage.module.css';
import SimpleButton from '~/components/SimpleButton/SimpleButton';

export default function testpage() {
    return (
        <div className={styles.testpage}>
            <button>Open Limit Chase Modal</button>
            <SimpleButton>Default Button</SimpleButton>
            <SimpleButton bg='dark3'>Custom Background</SimpleButton>
        </div>
    );
}
