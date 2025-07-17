import React, { useEffect, useState } from 'react';
import { FunnelChart, Funnel, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../services/api';

const STAGE_LABELS = {
  '1. lead generated': 'New',
  '2. proposal': 'Proposal Sent',
  '3. negotiation': 'Negotiation',
  '4. registration': 'Registration',
  '5. integration': 'Integration',
  '6. closed won': 'Won',
  '7. lost': 'Lost',
};

const STAGE_ORDER = [
  '1. lead generated',
  '2. proposal',
  '3. negotiation',
  '4. registration',
  '5. integration',
  '6. closed won',
  '7. lost',
];

const STAGE_COLORS = {
  '1. lead generated': '#3B82F6',
  '2. proposal': '#8B5CF6',
  '3. negotiation': '#F59E0B',
  '4. registration': '#10B981',
  '5. integration': '#22D3EE',
  '6. closed won': '#10B981',
  '7. lost': '#EF4444',
};

const LeadFunnel = ({ filters }) => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFunnel = async () => {
      setLoading(true);
      setError(null);
      try {
        // Only filter by bd_in_charge for the lead funnel
        const params = {};
        if (filters.bdInCharge && filters.bdInCharge !== 'all') {
          params.bd_in_charge = filters.bdInCharge;
        }

        const response = await api.analytics.getLeadFunnel(params);
        
        console.log("Response", response);
        // Check if response has error
        if (response.error) {
          throw new Error(response.error);
        }
        
        // Create funnel data only for stages that have leads
        const funnelData = STAGE_ORDER
          .map(stageKey => ({
            stage: STAGE_LABELS[stageKey],
            value: response[stageKey] || 0,
            color: STAGE_COLORS[stageKey],
          }))
          .filter(item => item.value > 0); // Only show stages with leads
        
        console.log("Funnel Data", funnelData);
        setData(funnelData);
        // Calculate total across all stages for pipeline share calculation
        const totalLeads = funnelData.reduce((sum, item) => sum + item.value, 0);
        setTotal(totalLeads);
        console.log("Data", data);
        console.log("Total", total);
      } catch (err) {
        console.error('Lead funnel error:', err);
        setError('Failed to load funnel data');
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchFunnel();
  }, [filters]);

  // Custom tooltip to show count and share of pipeline
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { stage, value } = payload[0].payload;
      const share = total ? ((value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-gray-900 p-2 rounded shadow text-xs text-white">
          <div><b>{stage}</b></div>
          <div>Leads: {value}</div>
          <div>Share of Pipeline: {share}%</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col w-full">
      <h4 className="text-xs text-gray-400 mb-2">Lead Funnel (All Time)</h4>
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">Loading funnel...</div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-400">{error}</div>
      ) : data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">No data available</div>
      ) : (
        <>
          <div>
            <ResponsiveContainer width="100%" height={250}>
              <FunnelChart>
                <Tooltip content={<CustomTooltip />} />
                <Funnel
                  dataKey="value"
                  data={data}
                  isAnimationActive
                  stroke="#fff"
                >
                  {data.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-3 justify-center">
            {data.map((item, idx) => (
              <div key={item.stage} className="flex items-center gap-2 text-xs">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="text-gray-300">{item.stage}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LeadFunnel; 