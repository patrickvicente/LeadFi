// Common options used across different components
export const commonOptions = {
  dateRange: [
    { value: 'today', label: 'Today' },
    { value: 'last7Days', label: 'Last 7 Days' },
    { value: 'last30Days', label: 'Last 30 Days'},
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisQuarter', label: 'This Quarter' },
    { value: 'lastQuarter', label: 'Last Quarter' },
    { value: 'thisYear', label: 'This Year' }
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
  ]
  // Add more customer-specific options
};

// Activity related options
export const activityOptions = {
  // Manual BD Activity Types
  manualActivityTypes: [
    'call',
    'email', 
    'meeting',
    'linkedin_message',
    'telegram_message',
    'follow_up',
    'proposal_sent',
    'demo',
    'negotiation',
    'onboarding'
  ],
  
  // System Activity Types (admin/automated)
  systemActivityTypes: [
    'lead_created',
    'lead_updated', 
    'lead_deleted',
    'lead_converted',
    'customer_created',
    'customer_updated',
    'customer_deleted',
    'status_changed',
    'stage_changed',
    'assignment_changed'
  ],
  
  // Automated Activity Types
  automatedActivityTypes: [
    'email_opened',
    'email_clicked',
    'document_viewed',
    'trading_activity',
    'account_milestone'
  ],
  
  // Activity Categories
  activityCategories: [
    { value: 'manual', label: 'Manual (BD)' },
    { value: 'system', label: 'System' },
    { value: 'automated', label: 'Automated' }
  ],
  
  // Combined activity types for dropdowns
  allActivityTypes: [
    // Manual activities
    { value: 'call', label: 'Call', category: 'manual' },
    { value: 'email', label: 'Email', category: 'manual' },
    { value: 'meeting', label: 'Meeting', category: 'manual' },
    { value: 'linkedin_message', label: 'LinkedIn Message', category: 'manual' },
    { value: 'telegram_message', label: 'Telegram Message', category: 'manual' },
    { value: 'follow_up', label: 'Follow Up', category: 'manual' },
    { value: 'proposal_sent', label: 'Proposal Sent', category: 'manual' },
    { value: 'demo', label: 'Demo', category: 'manual' },
    { value: 'negotiation', label: 'Negotiation', category: 'manual' },
    { value: 'onboarding', label: 'Onboarding', category: 'manual' },
    
    // System activities
    { value: 'lead_created', label: 'Lead Created', category: 'system' },
    { value: 'lead_updated', label: 'Lead Updated', category: 'system' },
    { value: 'lead_deleted', label: 'Lead Deleted', category: 'system' },
    { value: 'lead_converted', label: 'Lead Converted', category: 'system' },
    { value: 'customer_created', label: 'Customer Created', category: 'system' },
    { value: 'customer_updated', label: 'Customer Updated', category: 'system' },
    { value: 'customer_deleted', label: 'Customer Deleted', category: 'system' },
    { value: 'status_changed', label: 'Status Changed', category: 'system' },
    { value: 'stage_changed', label: 'Stage Changed', category: 'system' },
    { value: 'assignment_changed', label: 'Assignment Changed', category: 'system' },
    
    // Automated activities
    { value: 'email_opened', label: 'Email Opened', category: 'automated' },
    { value: 'email_clicked', label: 'Email Clicked', category: 'automated' },
    { value: 'document_viewed', label: 'Document Viewed', category: 'automated' },
    { value: 'trading_activity', label: 'Trading Activity', category: 'automated' },
    { value: 'account_milestone', label: 'Account Milestone', category: 'automated' }
  ],

  // Task Status Options
  taskStatuses: [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ],

  // Priority Options
  priorities: [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' }
  ],

  // Task-specific activity types (ones that make sense as tasks)
  taskActivityTypes: [
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'call', label: 'Schedule Call' },
    { value: 'email', label: 'Send Email' },
    { value: 'meeting', label: 'Schedule Meeting' },
    { value: 'proposal_sent', label: 'Send Proposal' },
    { value: 'demo', label: 'Product Demo' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'onboarding', label: 'Customer Onboarding' }
  ]
};

// Trading related options
export const tradingOptions = {
  vipLevel: [
    { value: '0', label: 'VIP 0' },
    { value: '1', label: 'VIP 1' },
    { value: '2', label: 'VIP 2' },
    // Add more VIP levels
  ],
  tradeType: [
    { value: 'spot', label: 'Spot' },
    { value: 'futures', label: 'Futures' }
  ],
  tradeSide: [
    { value: 'maker', label: 'Maker'},
    { value: 'taker', label: 'Taker'}
  ]
};

// Helper functions to transform options for different use cases
export const optionHelpers = {
  // Add 'all' option for filters
  addAllOption: (options) => [
    { value: 'all', label: 'All' },
    ...options
  ],

  // Get options for a specific field
  getOptions: (field, type) => {
    const optionsMap = {
      lead: leadOptions,
      customer: customerOptions,
      activity: activityOptions,
      trading: tradingOptions,
      common: commonOptions
    };
    return optionsMap[type]?.[field] || [];
  }
};