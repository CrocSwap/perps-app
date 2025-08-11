import { useMemo, useRef, useState } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { useCancelOrderService } from '~/hooks/useCancelOrderService';
import useNumFormatter from '~/hooks/useNumFormatter';
import { makeSlug, useNotificationStore } from '~/stores/NotificationStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { blockExplorer, EXTERNAL_PAGE_URL_PREFIX } from '~/utils/Constants';
import type {
    OrderDataIF,
    OrderDataSortBy,
} from '~/utils/orderbook/OrderBookIFs';
import { sortOrderData } from '~/utils/orderbook/OrderBookUtils';
import OpenOrdersTableHeader from './OpenOrdersTableHeader';
import OpenOrdersTableRow from './OpenOrdersTableRow';
interface OpenOrdersTableProps {
    data: OrderDataIF[];
    onCancel?: (time: number, coin: string) => void;
    onViewAll?: () => void;
    selectedFilter?: string;
    isFetched: boolean;
    pageMode?: boolean;
}

export default function OpenOrdersTable(props: OpenOrdersTableProps) {
    const { onCancel, selectedFilter, isFetched, pageMode, data } = props;
    const [isCancellingAll, setIsCancellingAll] = useState(false);
    const { executeCancelOrder } = useCancelOrderService();
    const { formatNum } = useNumFormatter();

    const notifications = useNotificationStore();

    const handleCancel = (time: number, coin: string) => {
        if (onCancel) {
            onCancel(time, coin);
        }
    };

    const handleCancelAll = async () => {
        if (filteredOrders.length === 0) {
            return;
        }

        setIsCancellingAll(true);

        const slug = makeSlug(10);

        try {
            // Show initial notification
            notifications.add({
                title: 'Cancelling All Orders',
                message: `Attempting to cancel ${filteredOrders.length} ${filteredOrders.length === 1 ? 'order' : 'orders'}...`,
                icon: 'spinner',
                slug,
            });

            const cancelPromises = filteredOrders.map(async (order) => {
                if (!order.oid) {
                    return {
                        success: false,
                        error: 'Order ID not found',
                        order,
                    };
                }

                try {
                    const result = await executeCancelOrder({
                        orderId: order.oid,
                    });

                    return {
                        ...result,
                        order,
                    };
                } catch (error) {
                    return {
                        success: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error',
                        order,
                    };
                }
            });

            // Wait for all cancel operations to complete
            const results = await Promise.allSettled(cancelPromises);

            let successCount = 0;
            let failureCount = 0;
            const failedOrders: string[] = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const cancelResult = result.value;
                    if (cancelResult.success) {
                        successCount++;
                        // Call the onCancel callback for successful cancellations
                        if (onCancel) {
                            onCancel(
                                cancelResult.order.timestamp,
                                cancelResult.order.coin,
                            );
                        }
                    } else {
                        failureCount++;
                        failedOrders.push(
                            `${cancelResult.order.coin} (${cancelResult.error})`,
                        );
                        notifications.remove(slug);
                    }
                } else {
                    failureCount++;
                    const order = filteredOrders[index];
                    failedOrders.push(`${order.coin} (${result.reason})`);
                    notifications.remove(slug);
                }
            });

            // Show result notification
            if (successCount > 0) {
                let successOrderSignature: string | undefined;
                results.forEach((result) => {
                    if (result.status === 'fulfilled' && result.value.success) {
                        successOrderSignature = result.value.signature;
                    }
                });
                if (successCount === 1) {
                    results.forEach((result) => {
                        if (
                            result.status === 'fulfilled' &&
                            result.value.success
                        ) {
                            const usdValueOfOrderStr = formatNum(
                                result.value.order.orderValue || 0,
                                2,
                                true,
                                true,
                            );
                            const order = result.value.order;
                            notifications.remove(slug);
                            notifications.add({
                                title: 'Order Cancelled',
                                message: `Successfully cancelled order for ${usdValueOfOrderStr} of ${order.coin}`,
                                icon: 'check',
                                removeAfter: 5000,
                                txLink: successOrderSignature
                                    ? `${blockExplorer}/tx/${successOrderSignature}`
                                    : undefined,
                            });
                        }
                    });
                } else {
                    notifications.remove(slug);
                    notifications.add({
                        title: 'All Orders Cancelled',
                        message: `Successfully cancelled all ${successCount} orders`,
                        icon: 'check',
                        removeAfter: 5000,
                        txLink: successOrderSignature
                            ? `${blockExplorer}/tx/${successOrderSignature}`
                            : undefined,
                    });
                }
            } else {
                let failedOrderSignature: string | undefined;
                results.forEach((result) => {
                    if (
                        result.status === 'fulfilled' &&
                        !result.value.success
                    ) {
                        failedOrderSignature = result.value.signature;
                    }
                });
                if (successCount > 0 && failureCount > 0) {
                    notifications.remove(slug);
                    notifications.add({
                        title: 'Partial Success',
                        message: `Cancelled ${successCount} orders, ${failureCount} failed`,
                        icon: 'error',
                        removeAfter: 8000,
                        txLink: failedOrderSignature
                            ? `${blockExplorer}/tx/${failedOrderSignature}`
                            : undefined,
                    });
                } else {
                    notifications.remove(slug);
                    notifications.add({
                        title: 'Cancel All Failed',
                        message: `Failed to cancel any orders. ${failedOrders.slice(0, 3).join(', ')}${failedOrders.length > 3 ? '...' : ''}`,
                        icon: 'error',
                        removeAfter: 8000,
                        txLink: failedOrderSignature
                            ? `${blockExplorer}/tx/${failedOrderSignature}`
                            : undefined,
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error during cancel all operation:', error);
            notifications.remove(slug);
            notifications.add({
                title: 'Cancel All Failed',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                icon: 'error',
                removeAfter: 5000,
            });
        } finally {
            setIsCancellingAll(false);
        }
    };

    const { userAddress } = useUserDataStore();

    const currentUserRef = useRef<string>('');
    currentUserRef.current = userAddress;

    const { symbol } = useTradeDataStore();

    const filteredOrders = useMemo(() => {
        if (!selectedFilter) {
            return data;
        }

        switch (selectedFilter) {
            case 'all':
                return data;
            case 'active':
                return data.filter((order) => order.coin === symbol);
            case 'long':
                return data.filter((order) => order.side === 'buy');
            case 'short':
                return data.filter((order) => order.side === 'sell');
        }

        return data;
    }, [data, selectedFilter, symbol]);

    const viewAllLink = useMemo(() => {
        return `${EXTERNAL_PAGE_URL_PREFIX}/openOrders/${userAddress}`;
    }, [userAddress]);

    return (
        <>
            <GenericTable
                noDataMessage='No open orders'
                storageKey={`OpenOrdersTable_${currentUserRef.current}`}
                data={filteredOrders}
                renderHeader={(sortDirection, sortClickHandler, sortBy) => (
                    <OpenOrdersTableHeader
                        sortBy={sortBy as OrderDataSortBy}
                        sortDirection={sortDirection}
                        sortClickHandler={sortClickHandler}
                        hasActiveOrders={
                            filteredOrders.length > 0 && !isCancellingAll
                        }
                        onCancelAll={handleCancelAll}
                    />
                )}
                renderRow={(order, index) => (
                    <OpenOrdersTableRow
                        key={`order-${index}`}
                        order={order}
                        onCancel={handleCancel}
                    />
                )}
                sorterMethod={sortOrderData}
                pageMode={pageMode}
                isFetched={isFetched}
                viewAllLink={viewAllLink}
                skeletonRows={7}
                skeletonColRatios={[1, 2, 2, 1, 1, 2, 1, 1, 2, 3, 1]}
                defaultSortBy={'timestamp'}
                defaultSortDirection={'desc'}
            />
        </>
    );
}
