export const getDateRange = (rangeType) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dayCalc = 24 * 60 * 60 * 1000

    switch(rangeType) {
    case 'today':
        return { start: today, end: today };
    case 'last7Days':
        return { start: new Date(today.getTime() - 7 * dayCalc), end: today };
    case 'last30Days':
        return { start: new Date(today.getTime() - 30 * dayCalc), end: today };
    case 'thisMonth':
        return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: today };
    case 'lastMonth':
        return { start: new Date(today.getFullYear(), today.getMonth() - 1, 1), end: new Date(today.getFullYear(), today.getMonth(), 0) };
    case 'thisQuarter':
        return { start: new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1), end: today };
    case 'lastQuarter':
        return { start: new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 - 3, 1), end: new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 0) };
    case 'thisYear':
        return { start: new Date(today.getFullYear(), 0, 1), end: today };
    }
};