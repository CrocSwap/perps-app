import Button from '~/components/Button/Button';
import styles from './vaultDetail.module.css';
import { MdKeyboardArrowLeft } from 'react-icons/md';

export default function vaultDetail() {
    return (
        <div className={styles.vault_details}>
            <header>
                <div>
                    <MdKeyboardArrowLeft />
                    <h2>Type Vault</h2>
                </div>
                <div>
                    <Button
                        size='medium'
                        onClick={() => console.log('withdraw')}
                    >
                        Withdraw
                    </Button>
                    <Button
                        size='medium'
                        selected
                        onClick={() => console.log('deposit')}
                    >
                        Deposit
                    </Button>
                </div>
            </header>
            <section className={styles.vault_stats}>
                <div>
                    <h3>TVL</h3>
                    <p>$140</p>
                </div>
                <div>
                    <h3>Past Month Return</h3>
                    <p>+18.45% APR</p>
                </div>
                <div>
                    <h3>Vault Capacity</h3>
                    <p>$250M</p>
                </div>
                <div>
                    <h3>Your Deposits</h3>
                    <p>$0</p>
                </div>
                <div>
                    <h3>All-Time Earned</h3>
                    <p>$0</p>
                </div>
            </section>
        </div>
    );
}