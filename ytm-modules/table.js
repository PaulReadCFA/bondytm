/**
 * Table Rendering Module
 * Renders accessible data table for bond cash flows and YTM
 */

import { $, formatCurrency, formatPercentage, announceToScreenReader, applyTableRoles } from './utils.js';

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
      Bond cash flow schedule showing period, time in years, yield-to-maturity, coupon payments,
      principal repayment, and total cash flows.
    </caption>

    <thead>
      <tr>
        <th scope="col" class="text-left">Period</th>
        <th scope="col" class="text-left table-var-4">Time (years)</th>
        <th scope="col" class="text-right table-var-3">Yield-to-maturity (𝑟)</th>
        <th scope="col" class="text-right table-var-2">Coupon (PMT) (USD)</th>
        <th scope="col" class="text-right table-var-4">Principal (FV) (USD)</th>
        <th scope="col" class="text-right">Total Cash Flow (USD)</th>
      </tr>
    </thead>

    <tbody>`;

  // data-label mirrors the column header: it becomes the visible label when the
  // shared base reflows each row into a card below 768px. cell-value keeps the
  // value as a single element so it stays on the right of that label.
  cashFlows.forEach((cf, index) => {
    html += `
      <tr>
        <th scope="row" class="text-left" data-label="Period">${cf.period}</th>
        <td class="text-left" data-label="Time (years)"><span class="cell-value table-var-4">${cf.timeYears.toFixed(1)}</span></td>
        <td class="text-right" data-label="Yield-to-maturity (𝑟)"><span class="cell-value table-var-3">${formatPercentage(ytmPercent)}</span></td>
        <td class="text-right" data-label="Coupon (PMT) (USD)"><span class="cell-value table-var-2">${formatCurrency(cf.couponPayment, false, false)}</span></td>
        <td class="text-right" data-label="Principal (FV) (USD)"><span class="cell-value table-var-4">${formatCurrency(cf.principalPayment, false, false)}</span></td>
        <td class="text-right" data-label="Total Cash Flow (USD)"><span class="cell-value"><strong>${formatCurrency(cf.totalCashFlow, false, false)}</strong></span></td>
      </tr>`;
  });

  html += `
    </tbody>
  `;

  // Inject the HTML
  table.innerHTML = html;
  applyTableRoles(table);

  announceToScreenReader('Table view loaded with bond cash flows.');
  
  setupTableKeyboardEscape();
}

/**
 * Set up Escape key to exit table
 */
function setupTableKeyboardEscape() {
  const tableRegion = document.getElementById('table-container');
  
  if (!tableRegion) return;
  
  if (tableRegion._escapeListener) {
    tableRegion.removeEventListener('keydown', tableRegion._escapeListener);
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
  
  tableRegion._escapeListener = escapeListener;
  tableRegion.addEventListener('keydown', escapeListener);
}