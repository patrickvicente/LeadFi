import React, {useState, useEffect} from "react";
import TradingSummaryCard from "./TradingSummaryCard";
import TradingBreakdownCard from "./TradingBreakdownCard";
import api from "../../services/api";

const TradingSummary = ({filters}) => {
    const [summary, setSummary] = useState([]);
    const [breakdownCards, setBreakdownCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Transform API response into card data format
    const transformSummaryData = (apiResponse) => {
        if (!apiResponse || !apiResponse.summary) return [];
        
        const summary = apiResponse.summary;
        
        return [
            {
                title: "Total Volume",
                value: summary.total_volume || 0,
                formattedValue: `$${(summary.total_volume || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`,
                subtitle: `Avg per trade: $${(summary.avg_volume_per_trade || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`,
                icon: "📊",
                trend: null
            },
            {
                title: "Total Fees",
                value: summary.total_fees || 0, 
                formattedValue: `$${(summary.total_fees || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`,
                subtitle: `Avg daily: $${(summary.avg_daily_fees || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`,
                icon: "💰",
                trend: null
            },
            {
                title: "Total Trades",
                value: summary.total_trades || 0,
                formattedValue: (summary.total_trades || 0).toLocaleString(),
                subtitle: `Over ${summary.trading_days || 0} trading days`,
                icon: "📈",
                trend: null
            },
            {
                title: "Active Customers", 
                value: summary.unique_customers || 0,
                formattedValue: (summary.unique_customers || 0).toString(),
                subtitle: "Unique customers trading",
                icon: "👥",
                trend: null
            }
        ];
    };

    // Transform breakdown data into trading pattern cards
    const transformBreakdownData = (apiResponse) => {
        if (!apiResponse || !apiResponse.breakdown_type || !apiResponse.breakdown_side) {
            return [];
        }

        const breakdownType = apiResponse.breakdown_type;
        const breakdownSide = apiResponse.breakdown_side;

        // Create a lookup for side data
        const sideData = {};
        breakdownSide.forEach(item => {
            sideData[item.trade_side] = item;
        });

        // Create cards for each trade type (spot, futures)
        return breakdownType.map(typeItem => {
            // Calculate maker/taker breakdown for this trade type
            // Note: This is an approximation since we don't have cross-tabulated data
            const totalVolume = typeItem.volume;
            const totalFees = typeItem.fees;
            
            // Get maker/taker ratios from overall breakdown
            const makerData = sideData.maker || { volume: 0, fees: 0 };
            const takerData = sideData.taker || { volume: 0, fees: 0 };
            const totalSideVolume = makerData.volume + takerData.volume;
            const totalSideFees = makerData.fees + takerData.fees;
            
            // Calculate proportional distribution (approximation)
            const makerRatio = totalSideVolume > 0 ? makerData.volume / totalSideVolume : 0.5;
            const takerRatio = totalSideVolume > 0 ? takerData.volume / totalSideVolume : 0.5;
            
            const estimatedMakerVolume = totalVolume * makerRatio;
            const estimatedTakerVolume = totalVolume * takerRatio;
            const estimatedMakerFees = totalFees * (totalSideFees > 0 ? makerData.fees / totalSideFees : 0.5);
            const estimatedTakerFees = totalFees * (totalSideFees > 0 ? takerData.fees / totalSideFees : 0.5);

            return {
                title: `${typeItem.trade_type.charAt(0).toUpperCase() + typeItem.trade_type.slice(1)} Trading`,
                value: totalVolume,
                formattedValue: `$${totalVolume.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                })}`,
                subtitle: `${typeItem.trade_count} trades`,
                icon: typeItem.trade_type === 'spot' ? "⚡" : "📈",
                trend: null,
                breakdown: {
                    maker: {
                        volume: estimatedMakerVolume,
                        fees: estimatedMakerFees,
                        formattedVolume: `$${estimatedMakerVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
                        formattedFees: `$${estimatedMakerFees.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                    },
                    taker: {
                        volume: estimatedTakerVolume,
                        fees: estimatedTakerFees,
                        formattedVolume: `$${estimatedTakerVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
                        formattedFees: `$${estimatedTakerFees.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                    }
                }
            };
        });
    };

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // Build API parameters from filters (similar to TradingVolume page)
                const params = {};
                
                if (filters.dateRange !== 'all' && filters.startDate && filters.endDate) {
                    params.start_date = filters.startDate.toISOString().split('T')[0];
                    params.end_date = filters.endDate.toISOString().split('T')[0];
                }
                
                if (filters.customerUid !== 'all') {
                    params.customer_uid = filters.customerUid;
                }
                
                const response = await api.trading.getTradingSummary(params);
                console.log("Received Trading Summary", response);
                
                // Transform API response into card data (using response.summary)
                const cardData = transformSummaryData(response);
                setSummary(cardData);
                
                // Transform breakdown data into trading pattern cards
                const breakdownCardData = transformBreakdownData(response);
                setBreakdownCards(breakdownCardData);
                
            } catch (error) {
                console.error('Error loading Trading Summary:', error);
                setError('Failed to load Trading Summary');
                setSummary([]); // Set empty array on error
                setBreakdownCards([]); // Set empty array on error
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [filters]);

    // Loading state
    if (loading) {
        return (
            <div className="space-y-6">
                {/* Main summary cards loading */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="bg-background border border-gray-700 rounded-lg p-4 animate-pulse">
                            <div className="h-4 bg-gray-700 rounded mb-2 w-3/4"></div>
                            <div className="h-8 bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
                
                {/* Breakdown cards loading */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1,2].map(i => (
                        <TradingBreakdownCard 
                            key={i}
                            loading={true}
                        />
                    ))}
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
                    <p className="mt-2">{error}</p>
                </div>
            </div>
        );
    }

    // Main content
    return (
        <div className="space-y-6">
            {/* Main Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {summary.map((item, index) => (
                    <TradingSummaryCard 
                        key={index} 
                        title={item.title} 
                        value={item.value}
                        formattedValue={item.formattedValue}
                        subtitle={item.subtitle} 
                        icon={item.icon} 
                        trend={item.trend} 
                    />
                ))}
            </div>

            {/* Breakdown Cards */}
            {breakdownCards.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {breakdownCards.map((item, index) => (
                        <TradingBreakdownCard 
                            key={index} 
                            title={item.title} 
                            value={item.value}
                            formattedValue={item.formattedValue}
                            subtitle={item.subtitle} 
                            icon={item.icon} 
                            trend={item.trend} 
                            breakdown={item.breakdown}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TradingSummary;