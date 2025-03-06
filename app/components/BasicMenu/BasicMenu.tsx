
import { useEffect, useRef, useState } from "react";
import styles from './BasicMenu.module.css';
import { FaChevronDown } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";


export interface BasicMenuItemIF {
    label: string;
    listener: () => void;
}

interface BasicMenuProps {
    items: BasicMenuItemIF[];
    positionVertical?: 'top' | 'bottom';
    positionHorizontal?: 'left' | 'right';
    icon?: React.ReactNode;
}

const BasicMenu: React.FC<BasicMenuProps> = ({ items, positionVertical = 'bottom', positionHorizontal = 'right', icon = <BsThreeDots />}) => {


    const [isOpen, setIsOpen] = useState(false);


  return (
<>

<div className={styles.basicMenuWrapper}>

    <div className={`${styles.triggerWrapper} ${isOpen ? styles.active : ''}`} onClick={() => setIsOpen(!isOpen)}>
        {icon}
    </div>

    {isOpen && (
        <div className={`${styles.menuContainer} ${styles[positionVertical]} ${styles[positionHorizontal]}`}>
            {items.map((item, index) => (
                <div key={index} className={styles.menuItem} onClick={() => {
                    item.listener();
                    setIsOpen(false);
                }}>  
                    {item.label}
                </div>
            ))}
        </div>
    )}
    

</div>
  </>

  );
}

export default BasicMenu;
