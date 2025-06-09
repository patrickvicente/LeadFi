import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

export const getLeads = () => api.get('/leads');
export const getCustomers = () => api.get('/customers');
export const getTradingVolume = () => api.get('/trading-volume');
// export const getOutreachMetrics = () => api.get('/analytics/outreach');
// export const getConversionRates = () => api.get('/analytics/conversion');
// export const getActivityMetrics = () => api.get('/analytics/activity');