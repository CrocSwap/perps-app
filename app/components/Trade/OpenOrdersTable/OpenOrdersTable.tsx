import React, { useMemo } from 'react';
import OpenOrdersTableHeader from './OpenOrdersTableHeader';
import OpenOrdersTableRow, { type OpenOrderData } from './OpenOrdersTableRow';
import styles from './OpenOrdersTable.module.css';
import { openOrdersData } from './data';
import { useTradeDataStore } from '~/stores/TradeDataStore';

interface OpenOrdersTableProps {
  onCancel?: (time: number, coin: string) => void;
  onViewAll?: () => void;
  selectedFilter: string;
}

export default function OpenOrdersTable(props: OpenOrdersTableProps) {
  const { onCancel, onViewAll, selectedFilter } = props;
  
  const handleCancel = (time: number, coin: string) => {
    if (onCancel) {
      onCancel(time, coin);
    }
  };

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    }
  };

  const { userSymbolOrders, userOrders } = useTradeDataStore();

  const filteredOrders = useMemo(() => {
    switch(selectedFilter){
      case 'all':
        return userOrders;
      case 'active':
        return userSymbolOrders;
      case 'long':
        return userOrders.filter((order) => order.side === 'buy');
      case 'short':
        return userOrders.filter((order) => order.side === 'sell');
    }

    return userOrders;
  }, [userOrders, selectedFilter]);
  
  return (
    <div className={styles.tableWrapper}>
      <OpenOrdersTableHeader />
      <div className={styles.tableBody}>
        {filteredOrders.slice(0, 50).map((order, index) => (
          <OpenOrdersTableRow 
            key={`order-${index}`} 
            order={order} 
            onCancel={handleCancel}
          />
        ))}
        
        {openOrdersData.length === 0 && (
          <div className={styles.rowContainer} style={{ justifyContent: 'center', padding: '2rem 0' }}>
            No open orders
          </div>
        )}
        
        {openOrdersData.length > 0 && (
          <a href="#" className={styles.viewAllLink} onClick={(e) => { 
            e.preventDefault();
            handleViewAll();
          }}>
            View All
          </a>
        )}
      </div>
    </div>
  );
}