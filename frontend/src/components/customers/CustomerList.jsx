import React from 'react';
import Customer from './Customer';

const CustomerList = ({ customers = [], onEditCustomer, onViewCustomer, onDeleteCustomer}) => {
    //  check for lead array
    if (!Array.isArray(customers)) {
        console.error('Customers prop must be an array');
        return null;
    }

  return (
    <div className="space-y-4">
      {customers.map(customer => (
        <Customer
          key={customer.customer_id}
          customer={customer}
          onEdit={onEditCustomer}
          onDelete={onDeleteCustomer}
          onView={onViewCustomer}
        />
      ))}
    </div>
  );
};

export default CustomerList;