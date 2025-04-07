import styles from './testpage.module.css';

interface propsIF {}

// main react fn
export default function testpage(props: propsIF) {
    false && props;

    return (
        <div className={styles.testpage}>
        </div>
    );
}
