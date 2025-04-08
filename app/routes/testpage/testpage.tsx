import { Helmet } from '~/utils/helmet';
import styles from './testpage.module.css';

interface propsIF {}

// main react fn
export default function testpage(props: propsIF) {
    false && props;

    return (
        <>
        <Helmet>
            <title>Hi there</title>
        </Helmet>
        <div className={styles.testpage}>
            boom
        </div>
        </>
    );
}
