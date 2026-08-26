/**
 * Validation Module
 * Input validation and error handling for Bond YTM Calculator
 */

import {
  updateFieldError,
  updateValidationSummary,
  hasErrors,
  requiredMessage,
  minMessage,
  maxMessage,
  usdAmount,
} from '../validation-ui.js';

export { updateFieldError, updateValidationSummary, hasErrors };

/**
 * Validation rules for each field
 */
const VALIDATION_RULES = {
  bondPrice: {
    min: 10,
    max: 200,
    required: true,
    label: 'Bond price',
    prefix: 'USD',
    helpText: 'Enter a bond price between USD10 and USD200'
  },
  couponPayment: {
    min: 0,
    max: 30,
    required: true,
    label: 'Coupon payment',
    prefix: 'USD',
    helpText: 'Enter annual coupon payment between USD0 and USD30'
  },
  years: {
    min: 0.5,
    max: 10,
    step: 0.5,
    required: true,
    label: 'Years to maturity',
    helpText: 'Enter years to maturity between 0.5 and 10 years'
  }
};

/**
 * Validate a single field
 * @param {string} field - Field name
 * @param {number} value - Field value
 * @returns {string|null} Error message or null
 */
export function validateField(field, value) {
  const rules = VALIDATION_RULES[field];
  if (!rules) return null;
  
  // Check if required
  if (rules.required && (value === '' || value == null || isNaN(value))) {
    return requiredMessage(rules.label);
  }
  
  // Check step for years (must be 0.5 increments)
  if (field === 'years' && rules.step) {
    const remainder = (value % rules.step).toFixed(2);
    if (parseFloat(remainder) !== 0) {
      return `${rules.label} must be in increments of ${rules.step} years (e.g., 0.5, 1.0, 1.5, 2.0...)`;
    }
  }
  
  // Check min/max
  if (rules.min !== undefined && value < rules.min) {
    const minDisplay = rules.prefix ? usdAmount(rules.min) : `${rules.min}${rules.unit || ''}`;
    return minMessage(rules.label, minDisplay);
  }
  
  if (rules.max !== undefined && value > rules.max) {
    const maxDisplay = rules.prefix ? usdAmount(rules.max) : `${rules.max}${rules.unit || ''}`;
    return maxMessage(rules.label, maxDisplay);
  }
  
  return null;
}

/**
 * Validate all inputs
 * @param {Object} inputs - Input values
 * @returns {Object} Error object
 */
export function validateAllInputs(inputs) {
  const errors = {};
  
  Object.keys(VALIDATION_RULES).forEach(field => {
    const error = validateField(field, inputs[field]);
    if (error) {
      errors[field] = error;
    }
  });
  
  return errors;
}
