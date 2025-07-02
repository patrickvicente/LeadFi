import React from 'react';

const TradingBreakdownCard = ({ 
    title, 
    value, 
    formattedValue, 
    subtitle, 
    icon, 
    breakdown,
    loading = false,
    error = null 
}) => {
    // Loading state
    if (loading) {
        return (
            <div className="bg-background border border-gray-700 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-3 w-3/4"></div>
                <div className="h-6 bg-gray-700 rounded mb-3"></div>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <div className="h-3 bg-gray-700 rounded w-16"></div>
                        <div className="h-3 bg-gray-700 rounded w-20"></div>
                        <div className="h-3 bg-gray-700 rounded w-16"></div>
                    </div>
                    <div className="flex justify-between">
                        <div className="h-3 bg-gray-700 rounded w-16"></div>
                        <div className="h-3 bg-gray-700 rounded w-20"></div>
                        <div className="h-3 bg-gray-700 rounded w-16"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-background border border-red-700 rounded-lg p-4">
                <div className="text-red-400 text-center">
                    <span className="text-xl">⚠️</span>
                    <p className="mt-2 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <h3 className="text-sm font-medium text-gray-400">{title}</h3>
                </div>
                <div className="text-right">
                    <div className="text-lg font-semibold text-white">{formattedValue}</div>
                    <div className="text-xs text-gray-500">{subtitle}</div>
                </div>
            </div>
            
            {/* Breakdown Table */}
            {breakdown && (
                <div className="border-t border-gray-700 pt-3">
                    {/* Table Header */}
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mb-2">
                        <div className="font-medium">Type</div>
                        <div className="font-medium text-center">Volume</div>
                        <div className="font-medium text-right">Fees</div>
                    </div>
                    
                    {/* Table Rows */}
                    <div className="space-y-1">
                        {/* Maker Row */}
                        <div className="grid grid-cols-3 gap-2 text-sm hover:bg-gray-800 rounded px-1 py-1 transition-colors">
                            <div className="text-gray-300 font-medium">Maker</div>
                            <div className="text-center text-white">{breakdown.maker?.formattedVolume || '$0'}</div>
                            <div className="text-right text-white">{breakdown.maker?.formattedFees || '$0.00'}</div>
                        </div>
                        
                        {/* Taker Row */}
                        <div className="grid grid-cols-3 gap-2 text-sm hover:bg-gray-800 rounded px-1 py-1 transition-colors">
                            <div className="text-gray-300 font-medium">Taker</div>
                            <div className="text-center text-white">{breakdown.taker?.formattedVolume || '$0'}</div>
                            <div className="text-right text-white">{breakdown.taker?.formattedFees || '$0.00'}</div>
                        </div>
                    </div>
                    
                    {/* Optional: Show percentages */}
                    {breakdown.maker && breakdown.taker && value > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-800">
                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                <div className="text-center">
                                    Maker: {((breakdown.maker.volume / value) * 100).toFixed(1)}%
                                </div>
                                <div className="text-center">
                                    Taker: {((breakdown.taker.volume / value) * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TradingBreakdownCard; 