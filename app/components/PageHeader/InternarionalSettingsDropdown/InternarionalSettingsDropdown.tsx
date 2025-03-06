import { useAppSettings } from '~/stores/AppSettingsStore';
import styles from './InternarionalSettingsDropdown.module.css'
import { Langs, NumFormatTypes, type LangType, type NumFormat } from '~/utils/Constants';

export default function InternarionalSettingsDropdown() {
    
    const { numFormat, setNumFormat, lang, setLang } = useAppSettings();




    

    return (
        <div className={styles.container}>

                <div className={styles.internationalSettingHeader}>Number Formatting: </div>
                {
                    NumFormatTypes.map((e: NumFormat) => (
                        <div key={e.value} className={`${styles.intSettingItem} ${numFormat.value === e.value ? styles.selected : ''}`} onClick={() => setNumFormat(e)}>
                            {e.label}
                        </div>
                    ))
                }        
                <div className={styles.internationalSettingHeader}>Language:</div>
                {
                    Langs.map((e: LangType) => (
                        <div key={e.label} className={`${styles.intSettingItem} ${lang.label === e.label ? styles.selected : ''}`} onClick={() => setLang(e)}>
                            {e.label}
                        </div>
                    ))
                }   
                <div className={styles.internationalSettingHeader}>Color</div>

        </div>
    )
}