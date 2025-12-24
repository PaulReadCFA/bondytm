/**
 * Validation Module
 * Input validation and error handling for Bond YTM Calculator
 */

import { $ } from './utils.js';

/**
 * Validation rules for each field
 */
const VALIDATION_RULES = {
  bondPrice: {
    min: 50,
    max: 150,
    required: true,
    label: 'Bond price',
    prefix: 'USD '
  },
  couponRate: {
    min: 0,
    max: 20,
    required: true,
    label: 'Coupon rate',
    unit: '%'
  },
  years: {
    min: 0.5,
    max: 10,
    required: true,
    label: 'Years to maturity'
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
  
  if (rules.required && (value === '' || value == null || isNaN(value))) {
    return `${rules.label} is required`;
  }
  
  if (rules.min !== undefined && value < rules.min) {
    const minDisplay = rules.prefix ? `${rules.prefix}${rules.min}` : `${rules.min}${rules.unit || ''}`;
    const maxDisplay = rules.prefix ? `${rules.prefix}${rules.max}` : `${rules.max}${rules.unit || ''}`;
    return `${rules.label} must be between ${minDisplay} and ${maxDisplay}`;
  }
  
  if (rules.max !== undefined && value > rules.max) {
    const minDisplay = rules.prefix ? `${rules.prefix}${rules.min}` : `${rules.min}${rules.unit || ''}`;
    const maxDisplay = rules.prefix ? `${rules.prefix}${rules.max}` : `${rules.max}${rules.unit || ''}`;
    return `${rules.label} must be between ${minDisplay} and ${maxDisplay}`;
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

/**
 * Update field error display
 * @param {string} fieldId - Field ID
 * @param {string|null} errorMessage - Error message or null
 */
export function updateFieldError(fieldId, errorMessage) {
  const input = $(`#${fieldId}`);
  if (!input) return;
  
  if (errorMessage) {
    input.setAttribute('aria-invalid', 'true');
    input.classList.add('error');
  } else {
    input.removeAttribute('aria-invalid');
    input.classList.remove('error');
  }
}

/**
 * Update validation summary
 * @param {Object} errors - Error object
 */
export function updateValidationSummary(errors) {
  const summary = $('#validation-summary');
  const list = $('#validation-list');

  if (!summary || !list) return;

  if (hasErrors(errors)) {
    list.innerHTML = Object.entries(errors)
      .map(([field, message]) => `<li>${message}</li>`)
      .join('');
    summary.style.display = 'block';
  } else {
    summary.style.display = 'none';
  }
}

/**
 * Check if there are any errors
 * @param {Object} errors - Error object
 * @returns {boolean} True if errors exist
 */
export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}