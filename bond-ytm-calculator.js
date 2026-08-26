/**
 * Bond Yield-to-Maturity Calculator - Main Entry Point
 * CFA Institute - Vanilla JavaScript Implementation
 * 
 * This calculator demonstrates yield-to-maturity calculations for coupon bonds
 * using numerical methods (bisection) to solve for the internal rate of return.
 * Built with accessibility (WCAG 2.1 AA) and maintainability in mind.
 */

import { state, setState, subscribe } from './ytm-modules/state.js';
import { calculateBondYTMMetrics } from './ytm-modules/calculations.js';
import { 
  validateAllInputs, 
  validateField, 
  updateFieldError, 
  updateValidationSummary,
  hasErrors 
} from './ytm-modules/validation.js';
import { 
  $, 
  listen, 
  focusElement, 
  announceToScreenReader,
  debounce,
  clampNumericInputLength,
  NUMERIC_INPUT_MAX_CHARS
} from './ytm-modules/utils.js';
import { renderChart, shouldShowLabels, destroyChart } from './ytm-modules/chart.js';
import { renderTable } from './ytm-modules/table.js';
import { renderResults } from './ytm-modules/results.js';
import { renderDynamicEquation } from './ytm-modules/equation.js';
import { allFinite } from './validation-ui.js';
import {
  applyChartTableVisibility,
  updateToggleButtonStates,
  announceView,
  VIEW_ANNOUNCEMENTS,
} from './view-toggle.js';

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize the calculator when DOM is ready
 */
function init() {
  console.log('Bond YTM Calculator initializing...');
  
  // Set up input event listeners
  setupInputListeners();
  
  // Set up view toggle listeners
  setupViewToggle();
  
  // Set up skip link handlers
  setupSkipLinks();
  
  // Set up window resize listener for chart labels
  setupResizeListener();
  
  // Subscribe to state changes
  subscribe(handleStateChange);
  
  // Initial calculation
  updateCalculations();
  
  // Run self-tests
  runSelfTests();
  
  console.log('Bond YTM Calculator ready');
}

/**
 * Set up skip link handlers for accessibility
 */
function setupSkipLinks() {
  const skipToDataEntry = document.querySelector('a[href="#bond-price"]');
  const skipToDataTable = document.querySelector('a[href="#table-container"]');
  
  if (skipToDataEntry) {
    listen(skipToDataEntry, 'click', (e) => {
      e.preventDefault();
      
      // Focus the first input field directly
      const firstInput = $('#bond-price');
      if (firstInput) {
        firstInput.focus();
        // Scroll into view
        firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
  
  if (skipToDataTable) {
    listen(skipToDataTable, 'click', (e) => {
      e.preventDefault();
      
      // Click the table view button
      const tableBtn = $('#table-view-btn');
      if (tableBtn) {
        tableBtn.click();
        
        // Focus the button after clicking
        setTimeout(() => {
          tableBtn.focus();
          tableBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    });
  }
}

// =============================================================================
// INPUT HANDLING
// =============================================================================

/**
 * Set up event listeners for input fields
 */
function setupInputListeners() {
  const inputs = [
    { id: 'bond-price', field: 'bondPrice' },
    { id: 'coupon-payment', field: 'couponPayment' },
    { id: 'years', field: 'years' }
  ];
  
  inputs.forEach(({ id, field }) => {
    const input = $(`#${id}`);
    if (!input) return;
    
    // Update state on input change (debounced)
    const debouncedUpdate = debounce(() => {
      const value = parseFloat(input.value);
      
      // Validate field
      const error = validateField(field, value);
      updateFieldError(id, error);
      
      // Update state
      const errors = { ...state.errors };
      delete errors.calculation;
      if (error) {
        errors[field] = error;
      } else {
        delete errors[field];
      }
      
      setState({
        [field]: value,
        errors
      });
      
      // Update validation summary
      updateValidationSummary(errors);
      
      // Recalculate if no errors
      if (!hasErrors(errors)) {
        updateCalculations();
      } else {
        setState({ ytmCalculations: null });
        clearCalculatedViews();
      }
    }, 300);
    
    const onInput = () => {
      clampNumericInputLength(input, NUMERIC_INPUT_MAX_CHARS);
      debouncedUpdate();
    };
    listen(input, 'input', onInput);
    listen(input, 'change', onInput);
  });
}

/**
 * Update YTM calculations based on current state
 */
function updateCalculations() {
  const { bondPrice, couponPayment, years, faceValue, frequency, errors } = state;
  
  // Don't calculate if there are validation errors
  if (hasErrors(errors)) {
    setState({ ytmCalculations: null });
    clearCalculatedViews();
    return;
  }
  
  try {
    // Calculate YTM metrics
    const calculations = calculateBondYTMMetrics({
      bondPrice,
      couponPayment,
      years,
      faceValue,
      frequency
    });
    if (!allFinite(
      calculations.yieldPerPeriod,
      calculations.bondEquivalentYield,
      calculations.effectiveAnnualYield
    )) {
      setState({ ytmCalculations: null });
      clearCalculatedViews();
      return;
    }
    
    // Update state with calculations
    setState({ ytmCalculations: calculations });
    
  } catch (error) {
    console.error('Calculation error:', error);
    const calculationErrors = {
      ...state.errors,
      calculation: error.message || 'Unable to calculate yield-to-maturity for these inputs'
    };
    setState({ ytmCalculations: null, errors: calculationErrors });
    updateValidationSummary(calculationErrors);
    clearCalculatedViews();
  }
}

function clearCalculatedViews() {
  destroyChart();

  const results = $('#results-content');
  if (results) results.innerHTML = '';

  const equation = $('#dynamic-mathml-equation');
  if (equation) equation.innerHTML = '';

  const table = $('#cash-flow-table');
  if (table) table.innerHTML = '';
}

// =============================================================================
// VIEW TOGGLE (CHART/TABLE)
// =============================================================================

/**
 * Set up chart/table view toggle
 */
function setupViewToggle() {
  const chartBtn = $('#chart-view-btn');
  const tableBtn = $('#table-view-btn');
  
  if (!chartBtn || !tableBtn) {
    console.error('Toggle buttons not found');
    return;
  }
  
  // Chart button click handler
  chartBtn.addEventListener('click', (e) => {
    const isForced = document.body.classList.contains('force-table');
    
    if (isForced || chartBtn.disabled) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      console.log('Chart button blocked - narrow screen detected');
      
      // Visual feedback: briefly highlight table button
      if (tableBtn) {
        tableBtn.style.transition = 'transform 0.2s ease';
        tableBtn.style.transform = 'scale(1.05)';
        setTimeout(() => {
          tableBtn.style.transform = 'scale(1)';
        }, 200);
      }
      
      // Force table view
      switchView('table');
      
      return false;
    }
    
    // Check if this was triggered by keyboard (Enter/Space)
    const isKeyboard = e.detail === 0;
    
    // Normal behavior - allow chart view
    switchView('chart');
    
    // If keyboard activation, focus the chart
    if (isKeyboard) {
      setTimeout(() => {
        const canvas = $('#ytm-chart');
        if (canvas) {
          canvas.focus();
        }
      }, 100);
    }
  }, true);
  
  // Table button click handler
  tableBtn.addEventListener('click', (e) => {
    // Check if this was triggered by keyboard (Enter/Space)
    const isKeyboard = e.detail === 0;
    
    switchView('table');
    
    // If keyboard activation, focus the table
    if (isKeyboard) {
      setTimeout(() => {
        const table = $('#table-container');
        if (table) {
          table.focus();
        }
      }, 100);
    }
  });
  
  // Arrow key navigation for toggle buttons
  const handleArrowKeys = (e) => {
    // Only handle arrow keys
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      
      const isForced = document.body.classList.contains('force-table');
      const currentlyOnChart = chartBtn === document.activeElement;
      const currentlyOnTable = tableBtn === document.activeElement;
      
      if (e.key === 'ArrowRight') {
        // Right arrow: move to table button and switch to table view
        if (currentlyOnChart) {
          tableBtn.focus();
          switchViewWithoutFocus('table');
        }
      } else if (e.key === 'ArrowLeft') {
        // Left arrow: move to chart button (if allowed) and switch to chart view
        if (currentlyOnTable && !isForced && !chartBtn.disabled) {
          chartBtn.focus();
          switchViewWithoutFocus('chart');
        }
      }
    }
    // Enter and Space are handled by default click behavior
  };
  
  chartBtn.addEventListener('keydown', handleArrowKeys);
  tableBtn.addEventListener('keydown', handleArrowKeys);
}

/**
 * Switch between chart and table views WITHOUT moving focus to content
 * Used for arrow key navigation on toggle buttons
 * @param {string} view - 'chart' or 'table'
 */
function switchViewWithoutFocus(view) {
  const chartBtn = $('#chart-view-btn');
  const tableBtn = $('#table-view-btn');
  const chartContainer = $('#chart-container');
  const tableContainer = $('#table-container');
  const legend = $('#chart-legend');
  
  const changed = state.viewMode !== view;
  setState({ viewMode: view });
  const forceTable = document.body.classList.contains('force-table');
  updateToggleButtonStates({ chartBtn, tableBtn, showingChart: view === 'chart', forceTable });
  applyChartTableVisibility({
    chartEl: chartContainer,
    tableEl: tableContainer,
    canvas: $('#ytm-chart'),
    showChart: view === 'chart',
  });
  syncChartPointAnnouncement(view === 'chart');
  if (legend) legend.style.display = view === 'chart' ? 'flex' : 'none';
  if (changed) announceView(VIEW_ANNOUNCEMENTS[view]);
}

/**
 * Switch between chart and table views
 * @param {string} view - 'chart' or 'table'
 */
function switchView(view) {
  const chartBtn = $('#chart-view-btn');
  const tableBtn = $('#table-view-btn');
  const chartContainer = $('#chart-container');
  const tableContainer = $('#table-container');
  const legend = $('#chart-legend');
  
  const changed = state.viewMode !== view;
  setState({ viewMode: view });
  const forceTable = document.body.classList.contains('force-table');
  updateToggleButtonStates({ chartBtn, tableBtn, showingChart: view === 'chart', forceTable });
  applyChartTableVisibility({
    chartEl: chartContainer,
    tableEl: tableContainer,
    canvas: $('#ytm-chart'),
    showChart: view === 'chart',
  });
  syncChartPointAnnouncement(view === 'chart');
  if (legend) legend.style.display = view === 'chart' ? 'flex' : 'none';
  if (changed) announceView(VIEW_ANNOUNCEMENTS[view]);
}

function syncChartPointAnnouncement(showingChart) {
  const region = $('#chart-point-announcement');
  if (!region) return;
  if (showingChart) {
    region.textContent = '';
    region.removeAttribute('aria-hidden');
  } else {
    region.setAttribute('aria-hidden', 'true');
    region.textContent = '';
  }
}

// =============================================================================
// RENDERING
// =============================================================================

/**
 * Handle state changes and update UI
 * @param {Object} newState - Updated state
 */
function handleStateChange(newState) {
  const { ytmCalculations, viewMode } = newState;
  
  if (!ytmCalculations) {
    // Clear displays if no calculations
    return;
  }
  
  // Update results section
  renderResults(ytmCalculations, {
    bondPrice: newState.bondPrice,
    couponPayment: newState.couponPayment,
    years: newState.years,
    faceValue: newState.faceValue
  });
  
  // Update dynamic equation
  renderDynamicEquation(ytmCalculations, {
    bondPrice: newState.bondPrice,
    couponPayment: newState.couponPayment,
    years: newState.years,
    faceValue: newState.faceValue
  });
  
  // Update chart if in chart view
  if (viewMode === 'chart') {
    const showLabels = shouldShowLabels();
    renderChart(
      ytmCalculations.cashFlows, 
      showLabels, 
      ytmCalculations.bondEquivalentYield
    );
  }
  
  // Always update table (even if hidden)
  renderTable(
    ytmCalculations.cashFlows,
    ytmCalculations.bondEquivalentYield
  );
}

// =============================================================================
// WINDOW RESIZE HANDLING
// =============================================================================

/**
 * Set up window resize listener for responsive chart labels
 */
function setupResizeListener() {
  let resizeTimeout;
  
  listen(window, 'resize', () => {
    // Debounce resize events
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      handleResponsiveView();
      
      if (state.viewMode === 'chart' && state.ytmCalculations) {
        const showLabels = shouldShowLabels();
        renderChart(
          state.ytmCalculations.cashFlows, 
          showLabels,
          state.ytmCalculations.bondEquivalentYield
        );
      }
    }, 250);
  });
  
  // Initial check
  handleResponsiveView();
}

/**
 * Handle responsive view switching based on viewport width
 */
function handleResponsiveView() {
  const chartBtn = $('#chart-view-btn');
  const tableBtn = $('#table-view-btn');
  const helper = $('#chart-helper-text');
  const viewportWidth = window.innerWidth;
  const body = document.body;
  
  // At very narrow widths (<= 480px), force table view and disable chart button
  if (viewportWidth <= 480) {
    body.classList.add('force-table');
    
    if (state.viewMode === 'chart') {
      switchView('table');
    }
    
    if (chartBtn) {
      chartBtn.disabled = true;
      chartBtn.setAttribute('aria-disabled', 'true');
      chartBtn.setAttribute('aria-describedby', 'chart-helper-text');
    }
    if (tableBtn) {
      tableBtn.disabled = false;
      tableBtn.removeAttribute('aria-disabled');
    }
    if (helper) helper.style.display = 'block';
  } else {
    body.classList.remove('force-table');
    
    if (chartBtn) {
      chartBtn.disabled = false;
      chartBtn.removeAttribute('aria-disabled');
      chartBtn.removeAttribute('aria-describedby');
    }
    if (helper) helper.style.display = 'none';
  }
  updateToggleButtonStates({
    chartBtn,
    tableBtn,
    showingChart: state.viewMode === 'chart',
    forceTable: viewportWidth <= 480,
  });
}

// =============================================================================
// SELF-TESTS
// =============================================================================

/**
 * Run self-tests to verify calculations
 */
function logSelfTest(name, passed, detail) {
  if (passed) console.log(`✓ ${name}`);
  else console.warn(`✗ ${name}${detail ? ': ' + detail : ''}`);
}

function runSelfTests() {
  console.log('Running self-tests...');

  const defaults = calculateBondYTMMetrics({
    bondPrice: 97.8, couponPayment: 11, years: 5, faceValue: 100, frequency: 2
  });
  logSelfTest(
    'Defaults → BEY ≈ 11.59%',
    Math.abs(defaults.bondEquivalentYield - 0.1159) < 0.0005,
    `got ${defaults.bondEquivalentYield}`
  );
  logSelfTest('Valid outputs are finite', Number.isFinite(defaults.bondEquivalentYield));

  const empty = validateAllInputs({ bondPrice: NaN, couponPayment: 11, years: 5 });
  logSelfTest('Empty bond price is required', Boolean(empty.bondPrice));

  const range = validateAllInputs({ bondPrice: 5, couponPayment: 11, years: 5 });
  logSelfTest('Price below min is rejected', Boolean(range.bondPrice));
  
  const tests = [
    {
      name: 'Par bond YTM (coupon = YTM)',
      inputs: { bondPrice: 100, couponPayment: 6, years: 5, faceValue: 100, frequency: 2 },
      expected: { ytmApprox: 0.06 }
    },
    {
      name: 'Discount bond YTM (price < par)',
      inputs: { bondPrice: 95, couponPayment: 6, years: 5, faceValue: 100, frequency: 2 },
      expected: { ytmShouldBe: 'greater than 0.06' }
    },
    {
      name: 'Premium bond YTM (price > par)',
      inputs: { bondPrice: 105, couponPayment: 6, years: 5, faceValue: 100, frequency: 2 },
      expected: { ytmShouldBe: 'less than 0.06' }
    },
    {
      name: 'High zero-coupon price supports negative YTM',
      inputs: { bondPrice: 200, couponPayment: 0, years: 5, faceValue: 100, frequency: 2 },
      expected: { ytmShouldBe: 'less than 0' }
    },
    {
      name: 'Low price converges above old fixed yield ceiling',
      inputs: { bondPrice: 10, couponPayment: 30, years: 10, faceValue: 100, frequency: 2 },
      expected: { finite: true }
    }
  ];
  
  tests.forEach(test => {
    try {
      const result = calculateBondYTMMetrics(test.inputs);
      
      if (test.expected.ytmApprox !== undefined) {
        const diff = Math.abs(result.bondEquivalentYield - test.expected.ytmApprox);
        if (diff <= 0.0001) {
          console.log(`✓ ${test.name} passed`);
        } else {
          console.warn(`✗ ${test.name} failed: expected ~${test.expected.ytmApprox}, got ${result.bondEquivalentYield}`);
        }
      } else if (test.expected.ytmShouldBe === 'greater than 0.06') {
        if (result.bondEquivalentYield > 0.06) {
          console.log(`✓ ${test.name} passed`);
        } else {
          console.warn(`✗ ${test.name} failed: YTM should be > 0.06, got ${result.bondEquivalentYield}`);
        }
      } else if (test.expected.ytmShouldBe === 'less than 0.06') {
        if (result.bondEquivalentYield < 0.06) {
          console.log(`✓ ${test.name} passed`);
        } else {
          console.warn(`✗ ${test.name} failed: YTM should be < 0.06, got ${result.bondEquivalentYield}`);
        }
      } else if (test.expected.ytmShouldBe === 'less than 0') {
        if (result.bondEquivalentYield < 0) {
          console.log(`✓ ${test.name} passed`);
        } else {
          console.warn(`✗ ${test.name} failed: YTM should be negative, got ${result.bondEquivalentYield}`);
        }
      } else if (test.expected.finite) {
        if (Number.isFinite(result.bondEquivalentYield)) {
          console.log(`✓ ${test.name} passed`);
        } else {
          console.warn(`✗ ${test.name} failed: YTM should be finite`);
        }
      }
    } catch (error) {
      console.error(`✗ ${test.name} threw error:`, error);
    }
  });
  
  console.log('Self-tests complete');
}

// =============================================================================
// CLEANUP
// =============================================================================

/**
 * Cleanup function (called on page unload)
 */
function cleanup() {
  destroyChart();
  console.log('Calculator cleanup complete');
}

// Register cleanup
window.addEventListener('beforeunload', cleanup);

// =============================================================================
// START THE APPLICATION
// =============================================================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already ready
  init();
}

// Export for potential external use
export { state, setState, updateCalculations };