import { useMemo, useState } from 'react';
import GenericTable from '~/components/Tables/GenericTable/GenericTable';
import { useCancelOrderService } from '~/hooks/useCancelOrderService';
import useNumFormatter from '~/hooks/useNumFormatter';
import { makeSlug, useNotificationStore } from '~/stores/NotificationStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { EXTERNAL_PAGE_URL_PREFIX, getTxLink } from '~/utils/Constants';
import { getDurationSegment } from '~/utils/functions/getSegment';
import type {
    OrderDataIF,
    OrderDataSortBy,
} from '~/utils/orderbook/OrderBookIFs';
import { sortOrderData } from '~/utils/orderbook/OrderBookUtils';
import OpenOrdersTableHeader from './OpenOrdersTableHeader';
import OpenOrdersTableRow from './OpenOrdersTableRow';
import { useTranslation } from 'react-i18next';
interface OpenOrdersTableProps {
    data: OrderDataIF[];
    onCancel?: (time: number, coin: string) => void;
    onViewAll?: () => void;
    selectedFilter?: string;
    isFetched: boolean;
    pageMode?: boolean;
    onClearFilter?: () => void;
}

export default function OpenOrdersTable(props: OpenOrdersTableProps) {
    const {
        onCancel,
        selectedFilter,
        isFetched,
        pageMode,
        data,
        onClearFilter,
    } = props;
    const [isCancellingAll, setIsCancellingAll] = useState(false);
    const { executeCancelOrder } = useCancelOrderService();
    const { formatNum } = useNumFormatter();
    const { t, i18n } = useTranslation();
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
                // title: 'Cancelling All Orders',
                title: t('transactions.cancellingAllOrders.title'),
                // message: `Attempting to cancel ${filteredOrders.length} ${filteredOrders.length === 1 ? 'order' : 'orders'}...`,
                message: t('transactions.cancellingAllOrders.message', {
                    count: filteredOrders.length,
                    noun: filteredOrders.length === 1 ? 'order' : 'orders',
                }),
                icon: 'spinner',
                slug,
                removeAfter: 60000,
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
                            if (typeof plausible === 'function') {
                                plausible('Onchain Action', {
                                    props: {
                                        actionType: 'Limit Cancel Success',
                                        orderType: 'Limit',
                                        success: true,
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
                            notifications.add({
                                title: t(
                                    'transactions.cancelLimitConfirmed.title',
                                ),
                                message: t(
                                    'transactions.cancelLimitConfirmed.message',
                                    {
                                        side: order.side,
                                        usdValueOfOrderStr,
                                        symbol: order.coin,
                                    },
                                ),
                                icon: 'check',
                                removeAfter: 5000,
                                txLink: getTxLink(successOrderSignature),
                            });
                        }
                    });
                } else {
                    notifications.remove(slug);
                    if (typeof plausible === 'function') {
                        plausible('Onchain Action', {
                            props: {
                                actionType: 'Limit Cancel All Success',
                                orderType: 'Limit',
                                success: true,
                                txDuration: getDurationSegment(
                                    timeOfSubmission,
                                    Date.now(),
                                ),
                            },
                        });
                    }
                    notifications.add({
                        title: t('transactions.cancelAllConfirmed.title'),
                        message: t('transactions.cancelAllConfirmed.message', {
                            count: successCount,
                        }),
                        icon: 'check',
                        removeAfter: 5000,
                        txLink: getTxLink(successOrderSignature),
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
                    if (typeof plausible === 'function') {
                        plausible('Onchain Action', {
                            props: {
                                actionType:
                                    'Limit Order Cancel All Partial Success',
                                orderType: 'Limit',
                                success: false,
                                txDuration: getDurationSegment(
                                    timeOfSubmission,
                                    Date.now(),
                                ),
                            },
                        });
                    }
                    notifications.add({
                        title: t('transactions.cancelAllPartialSuccess.title'),
                        message: t(
                            'transactions.cancelAllPartialSuccess.message',
                            {
                                successCount,
                                failureCount,
                            },
                        ),
                        icon: 'error',
                        removeAfter: 8000,
                        txLink: getTxLink(failedOrderSignature),
                    });
                } else {
                    notifications.remove(slug);
                    if (typeof plausible === 'function') {
                        plausible('Onchain Action', {
                            props: {
                                actionType: 'Limit Cancel All Fail',
                                orderType: 'Limit',
                                success: false,
                                txDuration: getDurationSegment(
                                    timeOfSubmission,
                                    Date.now(),
                                ),
                            },
                        });
                    }
                    notifications.add({
                        title: t('transactions.cancelAllFailed.title'),
                        message: `${t('transactions.cancelAllFailed.message')} ${failedOrders.slice(0, 3).join(', ')}${failedOrders.length > 3 ? '...' : ''}`,
                        icon: 'error',
                        removeAfter: 8000,
                        txLink: getTxLink(failedOrderSignature),
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error during cancel all operation:', error);
            notifications.remove(slug);
            notifications.add({
                title: t('transactions.cancelAllFailed.title'),
                message:
                    error instanceof Error
                        ? error.message
                        : t('transactions.unknownErrorOccurred'),
                icon: 'error',
                removeAfter: 5000,
            });
        } finally {
            setIsCancellingAll(false);
        }
    };

    const { symbol } = useTradeDataStore();
    const { userAddress } = useUserDataStore();

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

    const noDataMessage = useMemo(() => {
        switch (selectedFilter) {
            case 'active':
                return t('transactions.noOpenOrdersForMarket', { symbol });
            case 'long':
                return t('transactions.noOpenLongOrders');
            case 'short':
                return t('transactions.noOpenShortOrders');
            default:
                return t('transactions.noOpenOrders');
        }
    }, [selectedFilter, symbol, i18n.language]);

    const showClearFilter = selectedFilter && selectedFilter !== 'all';

    return (
        <>
            <GenericTable
                noDataMessage={noDataMessage}
                noDataActionLabel={
                    showClearFilter ? t('common.clearFilter') : undefined
                }
                onNoDataAction={showClearFilter ? onClearFilter : undefined}
                storageKey='OpenOrdersTable'
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
