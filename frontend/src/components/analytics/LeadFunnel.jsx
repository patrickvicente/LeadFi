import React, { useEffect, useState } from 'react';
import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const LeadFunnel = ({ filters }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const stageLabels = {
    "1. lead generated": "New",
    "2. proposal": "Qualified",
    "3. negotiation": "Qualified",
    "4. registration": "Converted",
    "4. integration": "Integration",
    "5. closed won": "Won",
    "6. lost": "Lost"
  };

  useEffect(() => {
    const fetchFunnel = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.analytics.getLeadFunnel(filters);
        // Convert response object to array for recharts
        const funnelData = Object.entries(stageLabels).map(([stage, label]) => ({
            stage,
            value: response[stage] || 0,
            label: label
        }));
        setData(funnelData);
      } catch (err) {
        setError('Failed to load funnel data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFunnel();
  }, [filters]);

  return (
    <div className="bg-gray-800 p-3 rounded-lg h-full flex flex-col">
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">Loading funnel...</div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-red-400">{error}</div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={220}>
            <FunnelChart>
              <Tooltip />
              <Funnel dataKey="value" data={data} isAnimationActive>
                <LabelList position="right" fill="#fff" stroke="none" dataKey="stage" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default LeadFunnel;