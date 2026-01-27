/**
 * State Management Module
 * Observable state pattern for reactive updates
 */

export const state = {
  // Bond parameters
  bondPrice: 97.8,
  couponPayment: 11.0, // Annual coupon payment in dollars
  years: 5,
  faceValue: 100,
  frequency: 2, // Semiannual
  
  // UI state
  viewMode: 'chart', // 'chart' or 'table'
  
  // Validation errors
  errors: {},
  
  // Calculated values
  ytmCalculations: null,
  
  // Subscribers
  listeners: []
};

/**
 * Update state and notify all subscribers
 * @param {Object} updates - Partial state updates
 */
export function setState(updates) {
  Object.assign(state, updates);
  state.listeners.forEach(fn => fn(state));
}

/**
 * Subscribe to state changes
 * @param {Function} fn - Callback function
 */
export function subscribe(fn) {
  state.listeners.push(fn);
}