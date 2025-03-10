import { useEffect, useRef, useState } from "react";
import styles from './Tabs.module.css';
import { FaChevronDown } from "react-icons/fa";


export interface TabIF {
    label: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
    initial?: boolean;
    initialMethod?: () => void;
}

interface TabsProps {
    tabs: TabIF[];
    headerRightContent?: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({ tabs, headerRightContent}) => {


    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
    const tabsHeaderRef = useRef<HTMLDivElement>(null);
    const tabIndicatorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {  
        if(tabs.length > 0) {
            tabs.forEach((tab, index) => {
                if(tab.initial) {
                    tab.initialMethod?.();
                    setActiveTabIndex(index);
                }
            })
        }
    }, [])

    useEffect(() => {

        const tabsHeaderElement = tabsHeaderRef.current;

        if(tabsHeaderElement){
            const selectedTabElement = tabsHeaderElement.querySelectorAll(`.${styles.tab}`)[activeTabIndex];
            if(tabIndicatorRef.current && selectedTabElement) {
                tabIndicatorRef.current.style.left = `${(selectedTabElement as HTMLDivElement)?.offsetLeft}px`;
                tabIndicatorRef.current.style.width = `${(selectedTabElement as HTMLDivElement)?.offsetWidth}px`;
                // tabIndicatorRef.current.style.left = `calc(${activeTabIndex * (100 / tabs.length)}%)`;
            }
        }


    }, [activeTabIndex])




  return (
<>

<div className={styles.tabsContainer}>

    <div ref={tabsHeaderRef} className={styles.tabsHeader}>
        <div className={styles.tabIndicator} 
        // style={{width: `calc(${100 / tabs.length }%)`}} 
        ref={tabIndicatorRef}></div>
        {
            tabs.map((tab, index) => (
                <div key={index} 
                className={`${styles.tab} ${activeTabIndex === index ? styles.activeTab : ''}`} 
                onClick={() => setActiveTabIndex(index)}>
                    {tab.label}
                </div>
            ))

        }
        {headerRightContent}

    </div>
    <div className={styles.tabsContent}>    
        {tabs[activeTabIndex].content}
    </div>

</div>
  </>

  );
}

export default Tabs;
