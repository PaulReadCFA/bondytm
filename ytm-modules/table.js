/**
 * Table Rendering Module
 * Renders accessible data table for bond cash flows and YTM
 */

import { $, formatCurrency, formatPercentage, announceToScreenReader } from './utils.js';

/**
 * Render cash flow table
 * @param {Array} cashFlows - Array of cash flow objects
 * @param {number} ytmBEY - Bond equivalent yield (decimal)
 */
export function renderTable(cashFlows, ytmBEY) {
  const table = $('#cash-flow-table');

  if (!table) {
    console.error('Table element not found');
    return;
  }

  const ytmPercent = ytmBEY * 100;

  // Build the HTML string
  let html = `
    <caption class="sr-only">
      Bond cash flow schedule showing period, time in years, yield to maturity, coupon payments,
      face value, and total cash flows. Note: Values in parentheses indicate negative cash flows.
    </caption>

    <thead>
      <tr>
        <th scope="col" class="text-left">Period</th>
        <th scope="col" class="text-left">Time (Years)</th>
        <th scope="col" class="text-right">YTM <span style="color: #7a46ff;">(<i>r</i>)</span></th>
        <th scope="col" class="text-right">Coupon Payment</th>
        <th scope="col" class="text-right">Face Value <span style="color: #0079a6;">(FV)</span></th>
        <th scope="col" class="text-right">Total Cash Flow</th>
      </tr>
    </thead>

    <tbody>`;

  // Add a row for every cash-flow
  cashFlows.forEach((cf, index) => {
    const isInitial = index === 0;
    const isFinal = index === cashFlows.length - 1;

    html += `
      <tr>
        <td class="text-left">${cf.period}</td>
        <td class="text-left">${cf.timeYears.toFixed(1)}</td>
        <td class="text-right" style="color: #7a46ff;" data-tooltip="Bond equivalent yield (annualized)">${formatPercentage(ytmPercent)}</td>
        <td class="text-right" style="color: #3c6ae5;" data-tooltip="${isInitial ? 'No coupon at time 0' : 'Semiannual coupon payment'}">${formatCurrency(cf.couponPayment)}</td>
        <td class="text-right" style="color: #0079a6;" data-tooltip="${isInitial ? 'Initial bond purchase (negative cash flow)' : (isFinal ? 'Face value returned at maturity' : 'No principal payment until maturity')}">${formatCurrency(cf.principalPayment)}</td>
        <td class="text-right" data-tooltip="${isInitial ? 'Amount paid to purchase bond' : 'Coupon' + (isFinal ? ' + Face value' : '') + ' = ' + formatCurrency(cf.totalCashFlow)}"><strong>${formatCurrency(cf.totalCashFlow)}</strong></td>
      </tr>`;
  });

  html += `
    </tbody>
  `;

  // Inject the HTML
  table.innerHTML = html;

  // Add accessibility attributes
  table.setAttribute('aria-label', 'Bond cash flow table');

  announceToScreenReader('Table view loaded with bond cash flows.');
  
  setupTableKeyboardEscape();
}

/**
 * Set up Escape key to exit table
 */
function setupTableKeyboardEscape() {
  const table = document.getElementById('cash-flow-table');
  
  if (!table) return;
  
  if (table._escapeListener) {
    table.removeEventListener('keydown', table._escapeListener);
  }
  
  const escapeListener = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      const calculator = document.getElementById('calculator');
      if (calculator) {
        calculator.focus();
        announceToScreenReader('Exited table, moved to calculator section');
      }
    }
  };
  
  table._escapeListener = escapeListener;
  table.addEventListener('keydown', escapeListener);
}