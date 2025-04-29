import { useEffect, useState } from 'react';

interface SortIconProps {
    sortDirection?: string;
}

const SortIcon: React.FC<SortIconProps> = ({ sortDirection }) => {
    const [isAscending, setIsAscending] = useState<boolean | null>(
        sortDirection === 'asc'
            ? true
            : sortDirection === 'desc'
              ? false
              : null,
    );

    const toggleSort = () => {
        if (sortDirection) {
            return;
        }
        setIsAscending((prev) => (prev === null ? true : !prev));
    };

    useEffect(() => {
        if (sortDirection) {
            setIsAscending(
                sortDirection === 'asc'
                    ? true
                    : sortDirection === 'desc'
                      ? false
                      : null,
            );
        } else {
            setIsAscending(null);
        }
    }, [sortDirection]);

    return (
        <>
            <svg
                xmlns='http://www.w3.org/2000/svg'
                width='10'
                height='21'
                viewBox='0 0 10 21'
                fill='none'
                onClick={toggleSort}
                style={{ cursor: 'pointer' }}
            >
                <path
                    d='M4.62647 14.9851C4.6733 15.038 4.7308 15.0803 4.79518 15.1093C4.85957 15.1383 4.92937 15.1532 4.99997 15.1532C5.07058 15.1532 5.14038 15.1383 5.20477 15.1093C5.26915 15.0803 5.32665 15.038 5.37347 14.9851L8.25997 11.7376C8.54698 11.4156 8.31798 10.9056 7.88648 10.9056H2.11347C1.68247 10.9056 1.45347 11.4156 1.73997 11.7381L4.62647 14.9851Z'
                    fill={isAscending === false ? 'var(--accent1)' : '#424246'}
                />
                <path
                    d='M2.11347 9.90569H7.88697C8.31797 9.90569 8.54697 9.39569 8.26047 9.07319L5.37397 5.82569C5.32715 5.77284 5.26965 5.73053 5.20526 5.70155C5.14088 5.67258 5.07108 5.65759 5.00047 5.65759C4.92987 5.65759 4.86007 5.67258 4.79568 5.70155C4.7313 5.73053 4.67379 5.77284 4.62697 5.82569L1.73947 9.07319C1.45297 9.39569 1.68197 9.90569 2.11347 9.90569Z'
                    fill={isAscending === true ? 'var(--accent1)' : '#424246'}
                />
            </svg>
        </>
    );
};

export default SortIcon;
