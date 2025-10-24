import styles from './testpage.module.css';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import { useTranslation } from 'react-i18next';

export default function testpage() {
    const { t } = useTranslation();

    return (
        <div className={styles.testpage}>
            <SimpleButton bg='dark2' hoverBg='accent1'>
                {t('common.cancel')}2as
            </SimpleButton>
        </div>
    );
}
