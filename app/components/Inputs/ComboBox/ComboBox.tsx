import { useState } from "react";
import styles from './ComboBox.module.css';
import { FaChevronDown } from "react-icons/fa";

interface ComboBoxProps {
  value: any;
  options: any[];
  fieldName?: string;
  onChange: (value: any) => void;
  modifyOptions?: (value: any) => string;
  modifyValue?: (value: any) => string;
  type?: 'big-val';
}

const ComboBox: React.FC<ComboBoxProps> = ({ value, options, fieldName, onChange, modifyOptions, modifyValue, type }) => {

  const [isOpen, setIsOpen] = useState(false);

  const optionOnClick = (option: any) => {
    onChange(fieldName ? option[fieldName] : option);
    setIsOpen(false);
  }

  const getClassName = () => {
    switch(type){
      case 'big-val':
        return styles.bigVal;
      default:
        return '';
    }
  }

  return (
<>
<div className={`${styles.comboBoxContainer} ${getClassName()}`}>  
  <div className={styles.comboBoxValueContainer} onClick={() => setIsOpen(!isOpen)}>
<div className={styles.comboBoxValue} >{modifyValue ? modifyValue(value) : value} </div>
<FaChevronDown className={`${styles.comboBoxIcon} ${isOpen ? styles.comboBoxIconOpen : ''}`} />
</div>

{
  isOpen && (
    <div className={styles.comboBoxOptionsWrapper}>
      
      {
        options.map((option) => (
          <div key={fieldName ? option[fieldName] : option} className={fieldName ? (option[fieldName] === value ? styles.comboBoxOptionSelected : '') : (option === value ? styles.comboBoxOptionSelected : '')} onClick={() => optionOnClick(option)}>
            {fieldName ? modifyOptions ? modifyOptions(option[fieldName]) : option[fieldName] : modifyOptions ? modifyOptions(option) : option}
            </div>
        ))
      }
    </div>
  )
}
</div>
  </>

  );
}

export default ComboBox;
