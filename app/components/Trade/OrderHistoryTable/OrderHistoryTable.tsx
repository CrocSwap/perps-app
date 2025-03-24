import React from 'react';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import styles from './OrderHistoryTable.module.css';
import OrderHistoryTableHeader from './OrderHistoryTableHeader';
import OrderHistoryTableRow from './OrderHistoryTableRow';
import { orderHistoryData } from './data';

interface OrderHistoryTableProps {
  onViewAll?: () => void;
}

export default function OrderHistoryTable(props: OrderHistoryTableProps) {
  const { onViewAll } = props;

  const { orderHistory } = useTradeDataStore();

  const handleViewAll = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onViewAll) {
      onViewAll();
    }
  };

  return (
    <div className={styles.tableWrapper}>
      <OrderHistoryTableHeader />
      <div className={styles.tableBody}>
        {orderHistory.map((order, index) => (
          <OrderHistoryTableRow 
            key={`order-${index}`} 
            order={order}
          />
        ))}
        
        {orderHistoryData.length === 0 && (
          <div className={styles.rowContainer} style={{ justifyContent: 'center', padding: '2rem 0' }}>
            No order history
          </div>
        )}
        
        {orderHistoryData.length > 0 && (
          <a href="#" className={styles.viewAllLink} onClick={handleViewAll}>
            View All
          </a>
        )}
      </div>
    </div>
  );
}