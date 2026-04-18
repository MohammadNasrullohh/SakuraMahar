// Validation helper functions

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  if (password.length < 6) {
    return { valid: false, message: 'Password minimal 6 karakter' };
  }
  return { valid: true };
};

/**
 * Validate phone number
 */
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^(62|0)[0-9]{9,12}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

/**
 * Validate required fields
 */
const validateRequired = (obj, fields) => {
  const errors = [];
  fields.forEach(field => {
    if (!obj[field] || obj[field].toString().trim() === '') {
      errors.push(`${field} harus diisi`);
    }
  });
  return errors;
};

/**
 * Validate numeric value
 */
const validateNumeric = (value) => {
  return !isNaN(value) && parseFloat(value) > 0;
};

/**
 * Validate date format (YYYY-MM-DD)
 */
const validateDateFormat = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(date);
};

/**
 * Sanitize input
 */
const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim()
    .replace(/[<>]/g, '')
    .slice(0, 1000); // Limit length
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateRequired,
  validateNumeric,
  validateDateFormat,
  sanitizeInput
};
