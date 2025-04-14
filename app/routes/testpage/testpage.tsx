import { useLinkGen } from '~/hooks/useLinkGen';
import styles from './testpage.module.css';

// main react fn
export default function testpage() {
    const PAGE = 'vaults';
    const { isPage } = useLinkGen(PAGE);
    return (
        <div className={styles.testpage}>
            <h2>Hi there!</h2>
            <p>This is {isPage || 'not'} the page "{PAGE}".</p>
        </div>
    );
}
