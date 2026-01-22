/**
 * Results Display Module
 * Renders YTM and analysis results
 */

import { formatCurrency, formatPercentage, createElement } from './utils.js';

/**
 * Render results and analysis section
 * @param {Object} calculations - YTM calculations
 * @param {Object} params - Input parameters
 */
export function renderResults(calculations, params) {
  const container = document.getElementById('results-content');
  
  if (!container) {
    console.error('Results container not found');
    return;
  }
  
  // Clear existing content
  container.innerHTML = '';
  
  // Create YTM result box
  const ytmBox = createYTMBox(calculations);
  container.appendChild(ytmBox);
  
  // Create bond details box
  const detailsBox = createBondDetailsBox(calculations, params);
  container.appendChild(detailsBox);
  
  // Create price comparison box
  const priceBox = createPriceComparisonBox(calculations, params);
  container.appendChild(priceBox);
}

/**
 * Create YTM result display box
 */
function createYTMBox(calculations) {
  const box = createElement('div', { className: 'result-box ytm-result' });
  
  const title = createElement('h5', { className: 'result-title ytm-result' }, 
    'Yield to Maturity (r)'
  );
  box.appendChild(title);
  
  const valueContainer = createElement('div', { className: 'result-value' });
  
  // YTM value with aria-live
  const ytmValue = createElement('div', {
    'aria-live': 'polite',
    'aria-atomic': 'true'
  }, formatPercentage(calculations.bondEquivalentYield * 100));
  valueContainer.appendChild(ytmValue);
  
  box.appendChild(valueContainer);
  
  // Description
  const description = createElement('div', { className: 'result-description' },
    'Annualized return if held to maturity'
  );
  box.appendChild(description);
  
  // Additional info
  const info = createElement('div', { 
    className: 'result-secondary',
    style: 'margin-top: 0.5rem;'
  });
  info.innerHTML = `Calculated with semiannual compounding`;
  box.appendChild(info);
  
  return box;
}

/**
 * Create bond details box
 */
function createBondDetailsBox(calculations, params) {
  const box = createElement('div', { className: 'result-box bond-details' });
  
  const title = createElement('h5', { className: 'result-title bond-details' }, 
    'Bond Details'
  );
  box.appendChild(title);
  
  const content = createElement('div', { 
    className: 'analysis-content',
    'role': 'region',
    'aria-labelledby': 'bond-details-heading'
  });
  
  title.id = 'bond-details-heading';
  
  // Details list
  const list = createElement('ul', { className: 'model-info-list' });
  
  const items = [
    { label: 'Coupon', value: `${formatPercentage(params.couponRate)} annual` },
    { label: 'Semiannual payment', value: formatCurrency(calculations.couponPayment) },
    { label: 'Periods', value: `${calculations.periods} (semiannual)` },
    { label: 'Years', value: params.years.toString() }
  ];
  
  items.forEach(item => {
    const li = createElement('li');
    li.innerHTML = `<strong>${item.label}:</strong> ${item.value}`;
    list.appendChild(li);
  });
  
  content.appendChild(list);
  box.appendChild(content);
  
  return box;
}

/**
 * Create price comparison box
 */
function createPriceComparisonBox(calculations, params) {
  const box = createElement('div', { className: 'result-box price-comparison' });
  
  const title = createElement('h5', { className: 'result-title price-comparison' }, 
    'Price vs Par'
  );
  box.appendChild(title);
  
  const content = createElement('div', { 
    className: 'analysis-content',
    'role': 'region',
    'aria-labelledby': 'price-comparison-heading'
  });
  
  title.id = 'price-comparison-heading';
  
  // Pricing analysis
  const analysisDiv = createElement('div', { className: 'analysis-type' });
  analysisDiv.textContent = calculations.pricingAnalysis.description;
  content.appendChild(analysisDiv);
  
  const detailDiv = createElement('div', { className: 'analysis-details' });
  detailDiv.textContent = calculations.pricingAnalysis.detail;
  content.appendChild(detailDiv);
  
  box.appendChild(content);
  
  return box;
}