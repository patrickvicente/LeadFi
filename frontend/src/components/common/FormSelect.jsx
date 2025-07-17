import React from 'react';
import { optionHelpers } from '../../config/options';

const FormSelect = ({ 
  name, 
  label, 
  value, 
  onChange, 
  type, 
  required = false,
  error,
  placeholder = "Select an option"
}) => {
  const options = optionHelpers.getOptions(name, type);

  return (
    <div>
      <label className="block text-sm font-medium text-text">
        {label}
        {required && <span className="text-highlight2"> *</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`mt-1 block w-full rounded-md border-gray-600 bg-background text-text shadow-sm focus:border-highlight1 focus:ring-highlight1 ${
          error ? 'border-highlight2' : ''
        }`}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-highlight2">{error}</p>
      )}
    </div>
  );
};

export default FormSelect;