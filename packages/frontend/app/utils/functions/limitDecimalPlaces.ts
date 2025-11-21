// Helper function to limit decimal places
const limitDecimalPlaces = (value: string, maxDecimals: number): string => {
    // If no decimal point, return as is
    if (!value.includes('.')) return value;

    const parts = value.split('.');
    if (parts.length === 2 && parts[1].length > maxDecimals) {
        return parts[0] + '.' + parts[1].substring(0, maxDecimals);
    }
    return value;
};

export default limitDecimalPlaces;
