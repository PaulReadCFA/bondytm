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
  const skipToVisualizer = document.querySelector('a[href="#visualizer"]');
  
  if (skipToVisualizer) {
    listen(skipToVisualizer, 'click', (e) => {
      e.preventDefault();
      
      // Switch to table view
      switchView('table');
      
      // Scroll the section into view
      const section = $('#visualizer');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      // Focus the table after switching
      setTimeout(() => {
        const table = $('#cash-flow-table');
        if (table) {
          table.focus();
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
    { id: 'coupon-rate', field: 'couponRate' },
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
  const { bondPrice, couponRate, years, faceValue, frequency, errors } = state;
  
  // Don't calculate if there are validation errors
  if (hasErrors(errors)) {
    setState({ ytmCalculations: null });
    return;
  }
  
  try {
    // Calculate YTM metrics
    const calculations = calculateBondYTMMetrics({
      bondPrice,
      couponRate,
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
  
  listen(chartBtn, 'click', () => switchView('chart'));
  listen(tableBtn, 'click', () => switchView('table'));
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
    chartContainer.style.display = 'block';
    tableContainer.style.display = 'none';
    legend.style.display = 'flex';
    
    // Announce change
    announceToScreenReader('Chart view active');
    
    // Focus chart container
    focusElement(chartContainer, 100);
    
  } else {
    tableBtn.classList.add('active');
    tableBtn.setAttribute('aria-pressed', 'true');
    chartBtn.classList.remove('active');
    chartBtn.setAttribute('aria-pressed', 'false');
    
    // Show table, hide chart
    tableContainer.style.display = 'block';
    chartContainer.style.display = 'none';
    legend.style.display = 'none';
    
    // Announce change
    announceToScreenReader('Table view active');
    
    // Focus table
    focusElement($('#cash-flow-table'), 100);
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
    couponRate: newState.couponRate,
    years: newState.years,
    faceValue: newState.faceValue
  });
  
  // Update dynamic equation
  renderDynamicEquation(ytmCalculations, {
    bondPrice: newState.bondPrice,
    couponRate: newState.couponRate,
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
  
  // At very narrow widths (< 600px), force table view and disable chart button
  if (viewportWidth < 600) {
    if (state.viewMode === 'chart') {
      switchView('table');
    }
    
    // Disable chart button
    if (chartBtn) {
      chartBtn.disabled = true;
      chartBtn.setAttribute('aria-disabled', 'true');
      chartBtn.title = 'Chart view not available at this screen size';
    }
    if (tableBtn) {
      tableBtn.disabled = false;
      tableBtn.removeAttribute('aria-disabled');
      tableBtn.title = '';
    }
  } else {
    // Re-enable chart button at wider widths
    if (chartBtn) {
      chartBtn.disabled = false;
      chartBtn.removeAttribute('aria-disabled');
      chartBtn.title = '';
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
      inputs: { bondPrice: 100, couponRate: 6, years: 5, faceValue: 100, frequency: 2 },
      expected: { ytmApprox: 0.06 }
    },
    {
      name: 'Discount bond YTM (price < par)',
      inputs: { bondPrice: 95, couponRate: 6, years: 5, faceValue: 100, frequency: 2 },
      expected: { ytmShouldBe: 'greater than 0.06' }
    },
    {
      name: 'Premium bond YTM (price > par)',
      inputs: { bondPrice: 105, couponRate: 6, years: 5, faceValue: 100, frequency: 2 },
      expected: { ytmShouldBe: 'less than 0.06' }
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
