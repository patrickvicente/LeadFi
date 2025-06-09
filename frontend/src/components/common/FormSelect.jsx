// frontend/src/components/common/FormSelect.jsx
import React from 'react';
import { optionHelpers } from '../../config/options';

const FormSelect = ({ 
  name, 
  label, 
  value, 
  onChange, 
  type, 
  required = false,
  error 
}) => {
  const options = optionHelpers.formatForForm(
    optionHelpers.getOptions(name, type)
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
          error ? 'border-red-500' : ''
        }`}
        required={required}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FormSelect;