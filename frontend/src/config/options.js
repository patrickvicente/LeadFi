// Common options used across different components
export const commonOptions = {
  dateRange: [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ],
  boolean: [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' }
  ]
};

// Lead related options
export const leadOptions = {
  status: [
    { value: '1. lead generated', label: '1. Lead Generated' },
    { value: '2. proposal', label: '2. Proposal' },
    { value: '3. negotiation', label: '3. Negotiation' },
    { value: '4. registration', label: '4. Registration' },
    { value: '5. integration', label: '5. Integration' },
    { value: '6. closed won', label: '6. Closed Won' },
    { value: '7. lost', label: '7. Lost' }
  ],
  source: [
    { value: 'company', label: 'Company' },
    { value: 'apollo', label: 'Apollo' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'hubspot', label: 'HubSpot' },
    { value: 'event', label: 'Event' },
    { value: 'research', label: 'Research' },
    { value: 'referral', label: 'Referral' }
  ],
  type: [
    { value: 'liquidity provider', label: 'Liquidity Provider' },
    { value: 'vip', label: 'VIP' },
    { value: 'institution', label: 'Institution' },
    { value: 'api', label: 'API' },
    { value: 'broker', label: 'Broker' },
    { value: 'otc', label: 'OTC' },
    { value: 'project mm', label: 'Project MM' },
    { value: 'asset manager', label: 'Asset manager' },
    { value: 'venture capital', label: 'Venture Capital' },
    { value: 'prop trader', label: 'Prop Trader' },
    { value: 'family office', label: 'Family Office' },
    { value: 'hft', label: 'HFT' },
    { value: 'other', label: 'Other' }
  ]
};

// Customer related options
export const customerOptions = {
  type: [
    { value: 'liquidity provider', label: 'Liquidity Provider' },
    { value: 'vip', label: 'VIP' },
    { value: 'institution', label: 'Institution' },
    { value: 'api', label: 'API' },
    { value: 'broker', label: 'Broker' },
    { value: 'otc', label: 'OTC' },
    { value: 'project mm', label: 'Project MM' },
    { value: 'asset manager', label: 'Asset Manager' },
    { value: 'venture capital', label: 'Venture Capital' },
    { value: 'prop trader', label: 'Prop Trader' },
    { value: 'family office', label: 'Family Office' },
    { value: 'hft', label: 'HFT' },
    { value: 'other', label: 'Other' }
  ],
  status: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'closed', label: 'Closed' }
  ]
  // Add more customer-specific options
};

// Activity related options
export const activityOptions = {
  activityType: [
    // Add  activity types
  ],
  // Add more activity-specific options
};

// Trading related options
export const tradingOptions = {
  vipLevel: [
    { value: '0', label: 'VIP 0' },
    { value: '1', label: 'VIP 1' },
    { value: '2', label: 'VIP 2' },
    // Add more VIP levels
  ],
  tradingType: [
    { value: 'spot', label: 'Spot' },
    { value: 'futures', label: 'Futures' }
  ]
};

// Helper functions to transform options for different use cases
export const optionHelpers = {
  // Add 'all' option for filters
  addAllOption: (options) => [
    { value: 'all', label: 'All' },
    ...options
  ],

  // Format options for form select
  formatForForm: (options) => 
    options.map(option => ({
      value: option.value,
      label: option.label
    })),

  // Format options for filter select
  formatForFilter: (options) => 
    optionHelpers.addAllOption(options),

  // Get options for a specific field
  getOptions: (field, type) => {
    const optionsMap = {
      lead: leadOptions,
      customer: customerOptions,
      activity: activityOptions,
      trading: tradingOptions
    };
    return optionsMap[type]?.[field] || [];
  }
};