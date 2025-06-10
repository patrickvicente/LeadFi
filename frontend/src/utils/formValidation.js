export const validateForm = (formData, validationRules) => {
    const errors = {};
  
    // Required fields
    if (validationRules.required) {
      validationRules.required.forEach(field => {
        if (!formData[field] || formData[field].trim() === '') {
          errors[field] = `${field.replace('_', ' ')} is required`;
        }
      });
    }
  
    // Email validation
    if (validationRules.email) {
      validationRules.email.forEach(field => {
        if (formData[field] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field])) {
          errors[field] = 'Invalid email format';
        }
      });
    }
  
    // Phone validation
    if (validationRules.phone) {
      validationRules.phone.forEach(field => {
        if (formData[field] && !/^\+?[\d\s-]{10,}$/.test(formData[field])) {
          errors[field] = 'Invalid phone number format';
        }
      });
    }
  
    // URL validation
    if (validationRules.url) {
        validationRules.url.forEach(field => {
        if (formData[field] && !/^.+\.(com|io|net|org|gov|edu|info|biz)(\/.*)?$/.test(formData[field])) {
            errors[field] = 'Invalid URL format';
        }
        });
    }

    // Telegram validation
    if (validationRules.telegram) {
        validationRules.telegram.forEach(field => {
            if (formData[field] && !/^@[\w]+$/.test(formData[field])) {
                errors[field] = 'Telegram handle should start with \'@\''
            }
        });
    }
  
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };