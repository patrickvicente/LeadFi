// frontend/src/components/common/Filter.jsx
import React from 'react';
import { optionHelpers } from '../../config/options';

const Filter = ({ 
  filters, 
  setFilters, 
  searchPlaceholder = "Search...",
  filterConfig // New prop to define filter configuration
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="mb-6 flex flex-col md:flex-row gap-4">
      {/* Search Input */}
      {filterConfig.showSearch && (
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder={searchPlaceholder}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {filterConfig.fields.map(field => {
          const options = optionHelpers.formatForFilter(
            optionHelpers.getOptions(field.name, field.type)
          );
          
          return (
            <select
              key={field.name}
              name={field.name}
              value={filters[field.name]}
              onChange={handleChange}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md"
            >
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        })}
      </div>
    </div>
  );
};

export default Filter;