export const getDateRange = (rangeType) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dayCalc = 24 * 60 * 60 * 1000

    switch(rangeType) {
    case 'today':
        return { startDate: today, endDate: today };
    case 'last7Days':
        return { startDate: new Date(today.getTime() - 7 * dayCalc), endDate: today };
    case 'last30Days':
        return { startDate: new Date(today.getTime() - 30 * dayCalc), endDate: today };
    case 'last_30_days':
        return { startDate: new Date(today.getTime() - 30 * dayCalc), endDate: today };
    case 'thisMonth':
        return { startDate: new Date(today.getFullYear(), today.getMonth(), 1), endDate: today };
    case 'lastMonth':
        return { startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1), endDate: new Date(today.getFullYear(), today.getMonth(), 0) };
    case 'thisQuarter':
        return { startDate: new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1), endDate: today };
    case 'lastQuarter':
        return { startDate: new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 - 3, 1), endDate: new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 0) };
    case 'thisYear':
        return { startDate: new Date(today.getFullYear(), 0, 1), endDate: today };
    case 'all':
        return { startDate: null, endDate: null };
    default:
        // Default to last 30 days if unknown range type
        return { startDate: new Date(today.getTime() - 30 * dayCalc), endDate: today };
    }
};