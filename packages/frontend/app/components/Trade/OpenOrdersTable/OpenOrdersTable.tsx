import { useMemo, useRef, useState } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { useCancelOrderService } from '~/hooks/useCancelOrderService';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { blockExplorer, EXTERNAL_PAGE_URL_PREFIX } from '~/utils/Constants';
import { getDurationSegment } from '~/utils/functions/getDurationSegment';
import packageJson from '../../../../package.json';
import type {
    OrderDataIF,
    OrderDataSortBy,
} from '~/utils/orderbook/OrderBookIFs';
import { sortOrderData } from '~/utils/orderbook/OrderBookUtils';
import OpenOrdersTableHeader from './OpenOrdersTableHeader';
import OpenOrdersTableRow from './OpenOrdersTableRow';
import { toast } from 'sonner';
interface OpenOrdersTableProps {
    data: OrderDataIF[];
    onCancel?: (time: number, coin: string) => void;
    onViewAll?: () => void;
    selectedFilter?: string;
    isFetched: boolean;
    pageMode?: boolean;
}
import Notification from '~/components/Notifications/Notification';

export default function OpenOrdersTable(props: OpenOrdersTableProps) {
    const { onCancel, selectedFilter, isFetched, pageMode, data } = props;
    const [isCancellingAll, setIsCancellingAll] = useState(false);
    const { executeCancelOrder } = useCancelOrderService();
    const { formatNum } = useNumFormatter();

    const handleCancel = (time: number, coin: string) => {
        if (onCancel) {
            onCancel(time, coin);
        }
    };

    const handleCancelAll = async () => {
        // ID to allow all notifications within the same toast
        const toastId: number = Date.now();

        if (filteredOrders.length === 0) {
            return;
        }

        setIsCancellingAll(true);

        try {
            // Show initial notification
            toast.custom(
                (t) => (
                    <Notification
                        data={{
                            toastId,
                            title: 'Cancelling All Orders',
                            message: `Attempting to cancel ${filteredOrders.length} ${filteredOrders.length === 1 ? 'order' : 'orders'}...`,
                            icon: 'spinner',
                            removeAfter: 60000,
                        }}
                        dismiss={() => toast.dismiss(t)}
                    />
                ),
                { id: toastId, duration: 60000 },
            );

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

            const timeOfSubmission = Date.now();
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
                    }
                } else {
                    failureCount++;
                    const order = filteredOrders[index];
                    failedOrders.push(`${order.coin} (${result.reason})`);
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
                            if (typeof plausible === 'function') {
                                plausible('Onchain Action', {
                                    props: {
                                        version: packageJson.version,
                                        actionType: 'Limit Cancel Success',
                                        orderType: 'Limit',
                                        direction:
                                            order.side === 'buy'
                                                ? 'Buy'
                                                : 'Sell',
                                        txDuration: getDurationSegment(
                                            timeOfSubmission,
                                            Date.now(),
                                        ),
                                    },
                                });
                            }
                            toast.custom(
                                (t) => (
                                    <Notification
                                        data={{
                                            toastId,
                                            title: 'Order Cancelled',
                                            message: `Successfully cancelled ${order.side} limit order for ${usdValueOfOrderStr} of ${order.coin}`,
                                            icon: 'check',
                                            removeAfter: 5000,
                                            txLink: successOrderSignature
                                                ? `${blockExplorer}/tx/${successOrderSignature}`
                                                : undefined,
                                        }}
                                        dismiss={() => toast.dismiss(t)}
                                    />
                                ),
                                { id: toastId, duration: 60000 },
                            );
                        }
                    });
                } else {
                    if (typeof plausible === 'function') {
                        plausible('Onchain Action', {
                            props: {
                                version: packageJson.version,
                                actionType: 'Limit Cancel All Success',
                                orderType: 'Limit',
                                txDuration: getDurationSegment(
                                    timeOfSubmission,
                                    Date.now(),
                                ),
                            },
                        });
                    }
                    toast.custom(
                        (t) => (
                            <Notification
                                data={{
                                    toastId,
                                    title: 'All Orders Cancelled',
                                    message: `Successfully cancelled all ${successCount} orders`,
                                    icon: 'check',
                                    removeAfter: 5000,
                                    txLink: successOrderSignature
                                        ? `${blockExplorer}/tx/${successOrderSignature}`
                                        : undefined,
                                }}
                                dismiss={() => toast.dismiss(t)}
                            />
                        ),
                        { id: toastId, duration: 60000 },
                    );
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
                    if (typeof plausible === 'function') {
                        plausible('Onchain Action', {
                            props: {
                                version: packageJson.version,
                                actionType:
                                    'Limit Order Cancel All Partial Success',
                                orderType: 'Limit',
                                txDuration: getDurationSegment(
                                    timeOfSubmission,
                                    Date.now(),
                                ),
                            },
                        });
                    }
                    toast.custom(
                        (t) => (
                            <Notification
                                data={{
                                    toastId,
                                    title: 'Partial Success',
                                    message: `Cancelled ${successCount} orders, ${failureCount} failed`,
                                    icon: 'error',
                                    removeAfter: 8000,
                                    txLink: failedOrderSignature
                                        ? `${blockExplorer}/tx/${failedOrderSignature}`
                                        : undefined,
                                }}
                                dismiss={() => toast.dismiss(t)}
                            />
                        ),
                        { id: toastId, duration: 60000 },
                    );
                } else {
                    if (typeof plausible === 'function') {
                        plausible('Onchain Action', {
                            props: {
                                version: packageJson.version,
                                actionType: 'Limit Cancel All Fail',
                                orderType: 'Limit',
                                txDuration: getDurationSegment(
                                    timeOfSubmission,
                                    Date.now(),
                                ),
                            },
                        });
                    }
                    toast.custom(
                        (t) => (
                            <Notification
                                data={{
                                    toastId,
                                    title: 'Cancel All Failed',
                                    message: `Failed to cancel any orders. ${failedOrders.slice(0, 3).join(', ')}${failedOrders.length > 3 ? '...' : ''}`,
                                    icon: 'error',
                                    removeAfter: 8000,
                                    txLink: failedOrderSignature
                                        ? `${blockExplorer}/tx/${failedOrderSignature}`
                                        : undefined,
                                }}
                                dismiss={() => toast.dismiss(t)}
                            />
                        ),
                        { id: toastId, duration: 60000 },
                    );
                }
            }
        } catch (error) {
            console.error('❌ Error during cancel all operation:', error);
            toast.custom(
                (t) => (
                    <Notification
                        data={{
                            toastId,
                            title: 'Cancel All Failed',
                            message:
                                error instanceof Error
                                    ? error.message
                                    : 'Unknown error occurred',
                            icon: 'error',
                            removeAfter: 5000,
                        }}
                        dismiss={() => toast.dismiss(t)}
                    />
                ),
                { id: toastId, duration: 60000 },
            );
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
