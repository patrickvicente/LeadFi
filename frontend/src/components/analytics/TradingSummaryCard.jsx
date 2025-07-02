import React from 'react';

const TradingSummaryCard = ({ 
    title, 
    value, 
    formattedValue, 
    subtitle, 
    icon, 
    trend, 
    loading = false, 
    error = null 
}) => {
    // Loading state
    if (loading) {
        return (
            <div className="bg-background border border-gray-700 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2 w-3/4"></div>
                <div className="h-8 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-background border border-red-700 rounded-lg p-4">
                <div className="text-red-400 text-center">
                    <span className="text-xl">⚠️</span>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    // Render trend indicator
    const renderTrend = () => {
        if (!trend) return null;

        const { direction, percentage, period } = trend;
        let trendColor = 'text-gray-400';
        let trendIcon = '→';

        if (direction === 'up') {
            trendColor = 'text-green-400';
            trendIcon = '↗️';
        } else if (direction === 'down') {
            trendColor = 'text-red-400';
            trendIcon = '↘️';
        }

        return (
            <div className={`text-sm font-semibold ${trendColor} flex items-center`}>
                <span className="mr-1">{trendIcon}</span>
                <span>{percentage}%</span>
                {period && <span className="text-xs text-gray-500 ml-1">{period}</span>}
            </div>
        );
    };

    return (
        <div className="bg-background border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors duration-200">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                    {icon && <span className="text-lg mr-2">{icon}</span>}
                    <h3 className="text-sm font-medium text-gray-400">{title}</h3>
                </div>
                {renderTrend()}
            </div>

            {/* Main Value */}
            <div className="mb-2">
                <p className="text-2xl font-bold text-text">
                    {formattedValue || (value !== undefined ? value.toString() : '—')}
                </p>
            </div>

            {/* Subtitle */}
            {subtitle && (
                <p className="text-xs text-gray-500">
                    {subtitle}
                </p>
            )}
        </div>
    );
};

export default TradingSummaryCard;