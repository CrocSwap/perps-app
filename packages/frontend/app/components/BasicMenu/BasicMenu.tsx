import { useState } from 'react';
import { BsThreeDots } from 'react-icons/bs';
import useOutsideClick from '~/hooks/useOutsideClick';
import styles from './BasicMenu.module.css';

export interface BasicMenuItemIF {
    label: string;
    listener: () => void;
    exclude?: boolean;
}

interface BasicMenuProps {
    items: BasicMenuItemIF[];
    positionVertical?: 'top' | 'bottom';
    positionHorizontal?: 'left' | 'right';
    icon?: React.ReactNode;
}

const BasicMenu: React.FC<BasicMenuProps> = ({
    items,
    positionVertical = 'bottom',
    positionHorizontal = 'right',
    icon = <BsThreeDots />,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const basicMenuRef = useOutsideClick<HTMLDivElement>(() => {
        setIsOpen(false);
    }, isOpen);

    return (
        <>
            <div className={styles.basicMenuWrapper} ref={basicMenuRef}>
                <div
                    className={`${styles.triggerWrapper} ${isOpen ? styles.active : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {icon}
                </div>

                {isOpen && (
                    <div
                        className={`${styles.menuContainer} ${styles[positionVertical]} ${styles[positionHorizontal]}`}
                    >
                        {items.map(
                            (item, index) =>
                                !item.exclude && (
                                    <div
                                        key={index}
                                        className={styles.menuItem}
                                        onClick={() => {
                                            item.listener();
                                            setIsOpen(false);
                                        }}
                                    >
                                        {item.label}
                                    </div>
                                ),
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default BasicMenu;
