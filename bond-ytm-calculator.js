/**
 * Bond Yield to Maturity Calculator - Main Entry Point
 * CFA Institute - Vanilla JavaScript Implementation
 * 
 * This calculator demonstrates yield to maturity calculations for coupon bonds
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
  debounce
} from './ytm-modules/utils.js';
import { renderChart, shouldShowLabels, destroyChart } from './ytm-modules/chart.js';
import { renderTable } from './ytm-modules/table.js';
import { renderResults } from './ytm-modules/results.js';
import { renderDynamicEquation } from './ytm-modules/equation.js';

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
  const skipToDataTable = document.querySelector('a[href="#cash-flow-table"]');
  
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
      
      // Switch to table view
      switchView('table');
      
      // Focus the table after switching
      setTimeout(() => {
        const table = $('#cash-flow-table');
        if (table) {
          table.focus();
          table.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
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
      }
    }, 300);
    
    listen(input, 'input', debouncedUpdate);
    listen(input, 'change', debouncedUpdate);
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
    
    // Update state with calculations
    setState({ ytmCalculations: calculations });
    
  } catch (error) {
    console.error('Calculation error:', error);
    setState({ ytmCalculations: null });
  }
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
        const table = $('#cash-flow-table');
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
  
  // Update state
  setState({ viewMode: view });
  
  // Update button states
  if (view === 'chart') {
    chartBtn.classList.add('active');
    chartBtn.setAttribute('aria-pressed', 'true');
    tableBtn.classList.remove('active');
    tableBtn.setAttribute('aria-pressed', 'false');
    
    // Show chart, hide table
    chartContainer.style.display = 'block';
    tableContainer.style.display = 'none';
    legend.style.display = 'flex';
    
    // Announce change but DON'T move focus
    announceToScreenReader('Chart view active');
    
  } else {
    tableBtn.classList.add('active');
    tableBtn.setAttribute('aria-pressed', 'true');
    chartBtn.classList.remove('active');
    chartBtn.setAttribute('aria-pressed', 'false');
    
    // Show table, hide chart
    tableContainer.style.display = 'block';
    chartContainer.style.display = 'none';
    legend.style.display = 'none';
    
    // Announce change but DON'T move focus
    announceToScreenReader('Table view active');
  }
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
  
  // Update state
  setState({ viewMode: view });
  
  // Update button states
  if (view === 'chart') {
    chartBtn.classList.add('active');
    chartBtn.setAttribute('aria-pressed', 'true');
    tableBtn.classList.remove('active');
    tableBtn.setAttribute('aria-pressed', 'false');
    
    // Show chart, hide table
    tableContainer.style.display = 'none';
    chartContainer.style.display = 'block';
    legend.style.display = 'flex';
    
    // Announce change
    announceToScreenReader('Chart view active');
    
  } else {
    tableBtn.classList.add('active');
    tableBtn.setAttribute('aria-pressed', 'true');
    chartBtn.classList.remove('active');
    chartBtn.setAttribute('aria-pressed', 'false');
    
    // Show table, hide chart
    chartContainer.style.display = 'none';
    tableContainer.style.display = 'block';
    legend.style.display = 'none';
    
    // Announce change
    announceToScreenReader('Table view active');
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
  const viewportWidth = window.innerWidth;
  const body = document.body;
  
  // At very narrow widths (<= 480px), force table view and disable chart button
  if (viewportWidth <= 480) {
    console.log('Narrow screen detected, forcing table view');
    
    body.classList.add('force-table');
    
    if (state.viewMode === 'chart') {
      switchView('table');
    }
    
    // Disable chart button
    if (chartBtn) {
      chartBtn.disabled = true;
      chartBtn.setAttribute('aria-disabled', 'true');
    }
    if (tableBtn) {
      tableBtn.disabled = false;
      tableBtn.removeAttribute('aria-disabled');
    }
  } else {
    // Re-enable chart button at wider widths
    body.classList.remove('force-table');
    
    if (chartBtn) {
      chartBtn.disabled = false;
      chartBtn.removeAttribute('aria-disabled');
    }
  }
}

// =============================================================================
// SELF-TESTS
// =============================================================================

/**
 * Run self-tests to verify calculations
 */
function runSelfTests() {
  console.log('Running self-tests...');
  
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
    }
  ];
  
  tests.forEach(test => {
    try {
      const result = calculateBondYTMMetrics(test.inputs);
      
      if (test.expected.ytmApprox !== undefined) {
        const diff = Math.abs(result.bondEquivalentYield - test.expected.ytmApprox);
        if (diff <= 0.0001) {
          console.log(`âœ“ ${test.name} passed`);
        } else {
          console.warn(`âœ— ${test.name} failed: expected ~${test.expected.ytmApprox}, got ${result.bondEquivalentYield}`);
        }
      } else if (test.expected.ytmShouldBe === 'greater than 0.06') {
        if (result.bondEquivalentYield > 0.06) {
          console.log(`âœ“ ${test.name} passed`);
        } else {
          console.warn(`âœ— ${test.name} failed: YTM should be > 0.06, got ${result.bondEquivalentYield}`);
        }
      } else if (test.expected.ytmShouldBe === 'less than 0.06') {
        if (result.bondEquivalentYield < 0.06) {
          console.log(`âœ“ ${test.name} passed`);
        } else {
          console.warn(`âœ— ${test.name} failed: YTM should be < 0.06, got ${result.bondEquivalentYield}`);
        }
      }
    } catch (error) {
      console.error(`âœ— ${test.name} threw error:`, error);
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