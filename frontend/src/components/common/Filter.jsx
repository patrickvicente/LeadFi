import React, { useState } from 'react';

const Filter = ({ filters, setFilters, config = [], onChange }) => {
  // State for search terms in searchable selects
  const [searchTerms, setSearchTerms] = useState({});

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {config.map(({ key, type, label, options }) => {
        if (type === 'select') {
          const safeOptions = Array.isArray(options) ? options : [];
          return (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
              <select
                value={filters[key]}
                onChange={e => {
                  if (onChange) {
                    onChange(key, e.target.value);
                  } else {
                    setFilters(prev => ({ ...prev, [key]: e.target.value }));
                  }
                }}
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                {safeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          );
        }
        
        if (type === 'searchable-select') {
          const safeOptions = Array.isArray(options) ? options : [];
          const searchTerm = searchTerms[key] || '';
          
          // Filter options based on search term
          const filteredOptions = safeOptions.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          // Find the current selection to display in the search box
          const currentSelection = safeOptions.find(opt => opt.value === filters[key]);
          const displayValue = searchTerm || (currentSelection ? currentSelection.label : '');
          
          return (
            <div key={key} className="relative">
              <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
              <div className="relative">
                <input
                  type="text"
                  value={displayValue}
                  onChange={e => {
                    const newSearchTerm = e.target.value;
                    setSearchTerms(prev => ({ ...prev, [key]: newSearchTerm }));
                    
                    // If search term is empty, reset to 'all'
                    if (!newSearchTerm) {
                      if (onChange) {
                        onChange(key, 'all');
                      } else {
                        setFilters(prev => ({ ...prev, [key]: 'all' }));
                      }
                    }
                  }}
                  placeholder="Search customers..."
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-blue-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Dropdown with filtered options */}
              {searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.slice(0, 20).map(option => (
                      <div
                        key={option.value}
                        onClick={() => {
                          if (onChange) {
                            onChange(key, option.value);
                          } else {
                            setFilters(prev => ({ ...prev, [key]: option.value }));
                          }
                          setSearchTerms(prev => ({ ...prev, [key]: '' }));
                        }}
                        className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-white border-b border-gray-700 last:border-b-0"
                      >
                        {option.label}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-400">No customers found</div>
                  )}
                </div>
              )}
            </div>
          );
        }
        
        if (type === 'text') {
          return (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
              <input
                type="text"
                value={filters[key] || ''}
                onChange={e => {
                  if (onChange) {
                    onChange(key, e.target.value);
                  } else {
                    setFilters(prev => ({ ...prev, [key]: e.target.value }));
                  }
                }}
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default Filter;