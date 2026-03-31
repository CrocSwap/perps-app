import { useState, useCallback } from 'react';
import { useReferralStore } from '~/stores/ReferralStore';
import { useUserDataStore } from '~/stores/UserDataStore';

interface UseRewardHistoryPaginationReturn {
    currentItems: any[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    startIndex: number;
    endIndex: number;
    goToNextPage: () => void;
    goToPreviousPage: () => void;
    goToPage: (page: number) => void;
    isLoading: boolean;
}

export const useRewardHistoryPagination =
    (): UseRewardHistoryPaginationReturn => {
        const userAddress = useUserDataStore((state) => state.userAddress);

        const {
            rewardHistory,
            rewardHistoryPage,
            rewardHistoryTotalCount,
            rewardHistoryPageSize,
            rewardHistoryTotalPages,
            fetchRewardHistory,
        } = useReferralStore();

        const [isLoading, setIsLoading] = useState(false);

        // Pagination actions
        const goToNextPage = useCallback(async () => {
            if (rewardHistoryPage < rewardHistoryTotalPages) {
                setIsLoading(true);
                await fetchRewardHistory(
                    userAddress ?? '',
                    rewardHistoryPage + 1,
                );
                setIsLoading(false);
            }
        }, [
            rewardHistoryPage,
            rewardHistoryTotalPages,
            fetchRewardHistory,
            userAddress,
        ]);

        const goToPreviousPage = useCallback(async () => {
            if (rewardHistoryPage > 1) {
                setIsLoading(true);
                await fetchRewardHistory(
                    userAddress ?? '',
                    rewardHistoryPage - 1,
                );
                setIsLoading(false);
            }
        }, [rewardHistoryPage, fetchRewardHistory, userAddress]);

        const goToPage = useCallback(
            async (page: number) => {
                const pageNumber = Math.min(
                    Math.max(1, page),
                    rewardHistoryTotalPages,
                );
                if (pageNumber !== rewardHistoryPage) {
                    setIsLoading(true);
                    await fetchRewardHistory(userAddress ?? '', pageNumber);
                    setIsLoading(false);
                }
            },
            [
                rewardHistoryPage,
                rewardHistoryTotalPages,
                fetchRewardHistory,
                userAddress,
            ],
        );

        // Calculate indices
        const startIndex = (rewardHistoryPage - 1) * rewardHistoryPageSize;
        const endIndex = Math.min(
            startIndex + rewardHistoryPageSize - 1,
            rewardHistoryTotalCount - 1,
        );

        return {
            currentItems: rewardHistory || [],
            currentPage: rewardHistoryPage,
            totalPages: rewardHistoryTotalPages,
            totalItems: rewardHistoryTotalCount,
            itemsPerPage: rewardHistoryPageSize,
            startIndex,
            endIndex,
            goToNextPage,
            goToPreviousPage,
            goToPage,
            isLoading,
        };
    };
