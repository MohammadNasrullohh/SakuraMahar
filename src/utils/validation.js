/**
 * Form Validation Utilities
 * Provides real-time validation feedback for forms
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\+?62|0)[0-9]{9,12}$/;
const PASSWORD_MIN_LENGTH = 8;

export const validateEmail = (email) => {
  if (!email) return { valid: false, message: 'Email tidak boleh kosong' };
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, message: 'Format email tidak valid' };
  }
  return { valid: true, message: 'Email valid' };
};

export const validatePassword = (password) => {
  if (!password) return { valid: false, message: 'Password tidak boleh kosong' };
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { 
      valid: false, 
      message: `Password minimal ${PASSWORD_MIN_LENGTH} karakter` 
    };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung huruf besar' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung angka' };
  }
  return { valid: true, message: 'Password kuat' };
};

export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return { valid: false, message: 'Password tidak cocok' };
  }
  return { valid: true, message: 'Password cocok' };
};

export const validatePhoneNumber = (phone) => {
  if (!phone) return { valid: false, message: 'Nomor telepon tidak boleh kosong' };
  if (!PHONE_REGEX.test(phone)) {
    return { valid: false, message: 'Nomor telepon tidak valid' };
  }
  return { valid: true, message: 'Nomor telepon valid' };
};

export const validateName = (name) => {
  if (!name || !name.trim()) {
    return { valid: false, message: 'Nama tidak boleh kosong' };
  }
  if (name.trim().length < 3) {
    return { valid: false, message: 'Nama minimal 3 karakter' };
  }
  return { valid: true, message: 'Nama valid' };
};

export const validateRequired = (value, fieldName = 'Field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, message: `${fieldName} tidak boleh kosong` };
  }
  return { valid: true, message: '' };
};

export const validateLength = (value, min, max, fieldName = 'Field') => {
  const length = String(value).length;
  if (length < min) {
    return { valid: false, message: `${fieldName} minimal ${min} karakter` };
  }
  if (max && length > max) {
    return { valid: false, message: `${fieldName} maksimal ${max} karakter` };
  }
  return { valid: true, message: '' };
};

export const validateUrl = (url) => {
  if (!url) return { valid: false, message: 'URL tidak boleh kosong' };
  try {
    new URL(url);
    return { valid: true, message: 'URL valid' };
  } catch {
    return { valid: false, message: 'URL tidak valid' };
  }
};

export const validateNumber = (value, min = null, max = null) => {
  const num = Number(value);
  
  if (isNaN(num)) {
    return { valid: false, message: 'Harus berupa angka' };
  }
  
  if (min !== null && num < min) {
    return { valid: false, message: `Nilai minimal ${min}` };
  }
  
  if (max !== null && num > max) {
    return { valid: false, message: `Nilai maksimal ${max}` };
  }
  
  return { valid: true, message: 'Angka valid' };
};

/**
 * Comprehensive form validation
 */
export const validateForm = (formData, rules) => {
  const errors = {};
  let isValid = true;

  Object.keys(rules).forEach(fieldName => {
    const rule = rules[fieldName];
    const value = formData[fieldName];
    
    // Run all validators for this field
    if (Array.isArray(rule)) {
      for (const validator of rule) {
        const result = validator(value);
        if (!result.valid) {
          errors[fieldName] = result.message;
          isValid = false;
          break; // Stop at first error
        }
      }
    } else {
      const result = rule(value);
      if (!result.valid) {
        errors[fieldName] = result.message;
        isValid = false;
      }
    }
  });

  return { isValid, errors };
};

/**
 * Get validation state class
 */
export const getValidationClass = (isValid, isDirty) => {
  if (!isDirty) return '';
  return isValid ? 'valid' : 'invalid';
};
