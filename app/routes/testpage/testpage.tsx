import { useLinkGen } from '~/hooks/useLinkGen';
import styles from './testpage.module.css';

// main react fn
export default function testpage() {
    useLinkGen('testpage');
    return (
        <div className={styles.testpage}>
            <h2>Hi there!</h2>
        </div>
    );
}
