import styles from './symbolinfofield.module.css';


interface SymbolInfoFieldProps {
  label: string;
  value: string;
  lastWsChange?: number;
  type?: 'positive' | 'negative';
}



const SymbolInfoField: React.FC<SymbolInfoFieldProps> = ({ label, value, lastWsChange, type }) => {


  


  return (
    <div className={styles.symbolInfoField}>
      <div className={styles.symbolInfoFieldLabel}>{label}</div>
      <div className={`${styles.symbolInfoFieldValue} 
      ${lastWsChange && lastWsChange > 0 ? styles.positiveAnimation : 
      lastWsChange && lastWsChange < 0 ? styles.negativeAnimation : ''}
      ${type === 'positive' ? styles.positive : 
      type === 'negative' ? styles.negative : ''}`}>{value}</div>
    </div>
  );
}

export default SymbolInfoField;
