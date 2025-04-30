import ScaleOrders from '~/components/Trade/OrderInput/ScaleOrders/ScaleOrders';
import styles from './testpage.module.css';

interface propsIF {}

// main react fn
export default function testpage(props: propsIF) {
    false && props;

    return (
        <div className={styles.testpage}>
            <div style={{ width: '400px' }}>
                <ScaleOrders
                    totalQuantity={parseFloat('0.2233')}
                    minPrice={parseFloat('242423')}
                    maxPrice={parseFloat('99993321')}
                    // isModal
                    onClose={() => console.log('close modal testpage')}
                />
            </div>
        </div>
    );
}
