import { useState, useMemo } from 'react';
import type { ReferralData, SortConfig } from './data';

interface UseReferralsTableProps {
    data: ReferralData[];
    itemsPerPage?: number;
}

interface UseReferralsTableReturn {
    currentItems: ReferralData[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    startIndex: number;
    endIndex: number;
    goToNextPage: () => void;
    goToPreviousPage: () => void;
    goToPage: (page: number) => void;
    sortConfig: SortConfig | null;
    handleSort: (key: keyof ReferralData) => void;
}

export const useReferralsTable = ({
    data,
    itemsPerPage = 10,
}: UseReferralsTableProps): UseReferralsTableReturn => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    // Apply sorting to data
    const sortedData = useMemo(() => {
        const sortableData = [...data];
        if (sortConfig !== null) {
            sortableData.sort((a, b) => {
                // Use the appropriate field for sorting based on the visible column
                const sortKey = sortConfig.key;
                let valueA, valueB;
                
                // Use the numeric values for sortable columns
                switch (sortKey) {
                    case 'dateJoined':
                        valueA = a._dateJoinedTimestamp;
                        valueB = b._dateJoinedTimestamp;
                        break;
                    case 'totalVolume':
                        valueA = a._totalVolumeValue;
                        valueB = b._totalVolumeValue;
                        break;
                    case 'feesPaid':
                        valueA = a._feesPaidValue;
                        valueB = b._feesPaidValue;
                        break;
                    case 'yourRewards':
                        valueA = a._yourRewardsValue;
                        valueB = b._yourRewardsValue;
                        break;
                    default:
                        valueA = a[sortKey];
                        valueB = b[sortKey];
                }
                
                if (valueA < valueB) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (valueA > valueB) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableData;
    }, [data, sortConfig]);

    // Pagination calculations
    const totalItems = sortedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Make sure current page is valid
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);
    if (validCurrentPage !== currentPage) {
        setCurrentPage(validCurrentPage);
    }
    
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems - 1);
    
    // Get current items for display
    const currentItems = sortedData.slice(startIndex, endIndex + 1);

    // Pagination actions
    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToPage = (page: number) => {
        const pageNumber = Math.min(Math.max(1, page), totalPages);
        setCurrentPage(pageNumber);
    };

    // Sorting action
    const handleSort = (key: keyof ReferralData) => {
        setSortConfig((prevSortConfig) => {
            if (prevSortConfig && prevSortConfig.key === key) {
                return {
                    key,
                    direction: prevSortConfig.direction === 'asc' ? 'desc' : 'asc',
                };
            }
            return { key, direction: 'asc' };
        });
    };

    return {
        currentItems,
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        startIndex,
        endIndex,
        goToNextPage,
        goToPreviousPage,
        goToPage,
        sortConfig,
        handleSort,
    };
};