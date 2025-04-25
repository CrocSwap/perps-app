export interface ReferralData {
    address: string;
    dateJoined: string;
    totalVolume: string;
    feesPaid: string;
    yourRewards: string;
    
    // For sorting purposes
    _dateJoinedTimestamp: number;
    _totalVolumeValue: number;
    _feesPaidValue: number;
    _yourRewardsValue: number;
}

export interface SortConfig {
    key: keyof ReferralData;
    direction: 'asc' | 'desc';
}

// Function to convert display strings to sortable values
const parseMoneyValue = (str: string): number => {
    return parseFloat(str.replace('$', '').replace(',', ''));
};

// Helper to create referral data with sortable values
const createReferralData = (
    address: string,
    dateJoined: string,
    totalVolume: string,
    feesPaid: string,
    yourRewards: string
): ReferralData => {
    // Convert date string to timestamp for sorting
    const [year, month, day] = dateJoined.split('/').map(Number);
    const dateTimestamp = new Date(year, month - 1, day).getTime();
    
    return {
        address,
        dateJoined,
        totalVolume,
        feesPaid,
        yourRewards,
        
        // Add sortable values
        _dateJoinedTimestamp: dateTimestamp,
        _totalVolumeValue: parseMoneyValue(totalVolume),
        _feesPaidValue: parseMoneyValue(feesPaid),
        _yourRewardsValue: parseMoneyValue(yourRewards)
    };
};

export const referralData: ReferralData[] = [
    createReferralData('0xaaa...aaa', '2025/02/25', '$0.00', '$0.00', '$0.00'),
    createReferralData('0xbbb...bbb', '2025/02/24', '$100.00', '$2.50', '$1.25'),
    createReferralData('0xccc...ccc', '2025/02/23', '$500.00', '$12.50', '$6.25'),
    createReferralData('0xddd...ddd', '2025/02/22', '$1,200.00', '$30.00', '$15.00'),
    createReferralData('0xeee...eee', '2025/02/21', '$300.00', '$7.50', '$3.75'),
    createReferralData('0xfff...fff', '2025/02/20', '$2,000.00', '$50.00', '$25.00'),
    createReferralData('0xggg...ggg', '2025/02/19', '$800.00', '$20.00', '$10.00'),
    createReferralData('0xhhh...hhh', '2025/02/18', '$1,500.00', '$37.50', '$18.75'),
    createReferralData('0xiii...iii', '2025/02/17', '$400.00', '$10.00', '$5.00'),
    createReferralData('0xjjj...jjj', '2025/02/16', '$950.00', '$23.75', '$11.88'),
    createReferralData('0xkkk...kkk', '2025/02/15', '$1,800.00', '$45.00', '$22.50'),
    createReferralData('0xlll...lll', '2025/02/14', '$250.00', '$6.25', '$3.13'),
    createReferralData('0xmmm...mmm', '2025/02/13', '$1,100.00', '$27.50', '$13.75'),
    createReferralData('0xnnn...nnn', '2025/02/12', '$750.00', '$18.75', '$9.38'),
    createReferralData('0xooo...ooo', '2025/02/11', '$3,000.00', '$75.00', '$37.50'),
];