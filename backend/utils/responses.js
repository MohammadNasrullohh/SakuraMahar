// Utility functions untuk API responses

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {Object} data - Response data
 * @param {Number} status - HTTP status code (default 200)
 */
const successResponse = (res, message, data = null, status = 200) => {
  res.status(status).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} status - HTTP status code (default 500)
 */
const errorResponse = (res, message, status = 500) => {
  res.status(status).json({
    success: false,
    error: message,
    status,
    timestamp: new Date().toISOString()
  });
};

/**
 * Validation response
 * @param {Object} res - Express response object
 * @param {String} field - Field name
 * @param {String} message - Validation message
 */
const validationError = (res, field, message) => {
  res.status(400).json({
    success: false,
    error: 'Validation Error',
    field,
    message,
    status: 400
  });
};

/**
 * Generate error response dengan multiple errors
 */
const validationErrors = (res, errors) => {
  res.status(400).json({
    success: false,
    error: 'Validation Errors',
    errors,
    status: 400
  });
};

module.exports = {
  successResponse,
  errorResponse,
  validationError,
  validationErrors
};
