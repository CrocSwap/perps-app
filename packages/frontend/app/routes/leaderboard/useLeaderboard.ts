import { useState, useEffect, useMemo, useCallback } from 'react';
import type { LeaderboardData } from '~/components/Leaderboard/LeaderboardTable/LeaderboardTableRow';
import { useDebouncedCallback } from '~/hooks/useDebounce';

type Period = '30D' | '7D' | '24H';
type SortConfig = {
    key: string;
    direction: 'asc' | 'desc' | null;
};

export const useLeaderboard = (initialData: LeaderboardData[]) => {
    // State for search and filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [filteredData, setFilteredData] =
        useState<LeaderboardData[]>(initialData);
    const [period, setPeriod] = useState<Period>('30D');
    const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(true);

    // Sort state
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'rank', // Default sort by rank
        direction: 'asc', // Default sort direction
    });

    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);

    const totalRows = filteredData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);

    // Keep input value in sync with search query
    useEffect(() => {
        setInputValue(searchQuery);
    }, [searchQuery]);

    // Handle search input change with debounce
    const debouncedSetSearchQuery = useDebouncedCallback((value: string) => {
        setSearchQuery(value);
    }, 300);

    // Handle search input change
    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setInputValue(value); // Update local state immediately for responsive UI
            debouncedSetSearchQuery(value); // Debounce the actual search
        },
        [debouncedSetSearchQuery],
    );

    // Clear search with proper cleanup
    const handleClearSearchInput = useCallback(() => {
        setInputValue('');
        setSearchQuery('');
    }, []);

    // Filter and sort data using memoization
    const filteredAndSortedData = useMemo(() => {
        let dataToProcess = [...initialData];

        // Apply search filter
        if (searchQuery.trim()) {
            const lowercaseQuery = searchQuery.toLowerCase();
            dataToProcess = dataToProcess.filter((item) =>
                item.trader.toLowerCase().includes(lowercaseQuery),
            );
        }

        // Apply sorting
        if (sortConfig.key && sortConfig.direction) {
            dataToProcess.sort((a, b) => {
                // Use bracket notation to access properties dynamically
                const aValue = a[sortConfig.key as keyof LeaderboardData];
                const bValue = b[sortConfig.key as keyof LeaderboardData];

                // Handle different types of values
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'asc'
                        ? aValue - bValue
                        : bValue - aValue;
                }

                // Handle string values
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }

                return 0;
            });
        }

        return dataToProcess;
    }, [initialData, searchQuery, sortConfig.key, sortConfig.direction]);

    // Update filtered data and reset pagination when data changes
    useEffect(() => {
        setFilteredData(filteredAndSortedData);
        setCurrentPage(1);
    }, [filteredAndSortedData]);

    // Memoized pagination data
    const currentPageData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, currentPage, rowsPerPage]);

    // Memoized pagination values
    const paginationValues = useMemo(() => {
        const startRow = (currentPage - 1) * rowsPerPage + 1;
        const endRow = Math.min(startRow + rowsPerPage - 1, totalRows);
        return { startRow, endRow };
    }, [currentPage, rowsPerPage, totalRows]);

    // Handle sort when clicking on table headers - memoized with useCallback
    const handleSort = useCallback((key: string) => {
        setSortConfig((prev) => {
            // If clicking on same column, toggle direction
            if (prev.key === key) {
                // Cycle through: asc -> desc -> null (no sort) -> asc
                const nextDirection =
                    prev.direction === 'asc'
                        ? 'desc'
                        : prev.direction === 'desc'
                          ? null
                          : 'asc';

                return {
                    key,
                    direction: nextDirection as 'asc' | 'desc' | null,
                };
            }

            // If clicking on new column, start with ascending
            return {
                key,
                direction: 'asc',
            };
        });
    }, []);

    // Clear search - memoized with useCallback
    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    // Handle period change - memoized with useCallback
    const handlePeriodChange = useCallback((newPeriod: Period) => {
        setPeriod(newPeriod);
        setIsPeriodDropdownOpen(false);
    }, []);

    // Handle rows per page change - memoized with useCallback
    const handleRowsPerPageChange = useCallback((rows: number) => {
        setRowsPerPage(rows);
        setIsRowsDropdownOpen(false);
        // Reset to first page
        setCurrentPage(1);
    }, []);

    // Handle page navigation - memoized with useCallback
    const goToNextPage = useCallback(() => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    }, [currentPage, totalPages]);

    const goToPreviousPage = useCallback(() => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    }, [currentPage]);

    // Toggle period dropdown - memoized with useCallback
    const togglePeriodDropdown = useCallback(() => {
        setIsPeriodDropdownOpen((prev) => !prev);
    }, []);

    // Toggle rows dropdown - memoized with useCallback
    const toggleRowsDropdown = useCallback(() => {
        setIsRowsDropdownOpen((prev) => !prev);
    }, []);

    // Toggle fullscreen - memoized with useCallback
    const toggleFullScreen = useCallback(() => {
        setIsFullScreen((prev) => !prev);
    }, []);

    // Memoize navigation button disabled states
    const isPrevButtonDisabled = useMemo(
        () => currentPage === 1,
        [currentPage],
    );
    const isNextButtonDisabled = useMemo(
        () => currentPage === totalPages,
        [currentPage, totalPages],
    );

    return {
        // State
        searchQuery,
        inputValue,
        period,
        isPeriodDropdownOpen,
        isRowsDropdownOpen,
        rowsPerPage,
        currentPage,
        isFullScreen,
        sortConfig,
        setIsPeriodDropdownOpen,
        setIsRowsDropdownOpen,

        // Calculated values
        totalRows,
        totalPages,
        startRow: paginationValues.startRow,
        endRow: paginationValues.endRow,
        isPrevButtonDisabled,
        isNextButtonDisabled,

        // Data
        filteredData,
        currentPageData,

        // Actions
        setSearchQuery,
        handleSearchChange,
        handleClearSearch,
        handleClearSearchInput,
        handlePeriodChange,
        handleRowsPerPageChange,
        goToNextPage,
        goToPreviousPage,
        handleSort,
        togglePeriodDropdown,
        toggleRowsDropdown,
        toggleFullScreen,
    };
};
