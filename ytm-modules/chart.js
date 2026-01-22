/**
 * Chart Module
 * Chart rendering using Chart.js with keyboard accessibility
 */

import { formatCurrency, formatPercentage } from './utils.js';

// Bond YTM Colors - Aligned with EE01
const COLORS = {
  coupon: '#3c6ae5',      // Blue - PMT (coupon payments)
  principal: '#0079a6',   // Teal - FV (face value/principal)
  purchase: '#b95b1d',    // Orange - PV (bond purchase)
  yield: '#7a46ff',       // Purple - r (yield/rate)
  time: '#15803d',        // Green - T (time)
  darkText: '#06005a',
  axisColor: '#374151'    // Darker gray for axes
};

let chartInstance = null;
let currentFocusIndex = 0;
let isKeyboardMode = false;

/**
 * Create or update bond YTM chart
 * @param {Array} cashFlows - Array of cash flow objects
 * @param {boolean} showLabels - Whether to show value labels
 * @param {number} ytmBEY - Bond equivalent yield (percentage)
 */
export function renderChart(cashFlows, showLabels = true, ytmBEY = null) {
  const canvas = document.getElementById('ytm-chart');
  
  if (!canvas) {
    console.error('Chart canvas not found');
    return;
  }
  
  // Make canvas focusable and add keyboard navigation
  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-roledescription', 'interactive chart');
  canvas.setAttribute(
    'aria-label',
    'Interactive bond cash flow and yield chart showing purchase price, coupon payments, principal repayment, and yield to maturity over time. Press Tab to focus, then use Left and Right arrow keys to navigate between periods. Home goes to first period, End goes to last period.'
  );

  const ctx = canvas.getContext('2d');
  
  // Prepare data for Chart.js
  const labels = cashFlows.map(cf => cf.timeYears.toFixed(1));
  
  // Separate coupon and principal data
  const couponData = cashFlows.map(cf => cf.couponPayment);
  const principalData = cashFlows.map(cf => cf.principalPayment);
  
  // Calculate total for labels
  const totalData = cashFlows.map(cf => cf.totalCashFlow);
  
  // Destroy existing chart instance
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  // Reset focus index
  currentFocusIndex = 0;
  
  // Create new chart
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Principal/Purchase',
          data: principalData,
          backgroundColor: principalData.map(val => 
            val >= 0 ? COLORS.principal : COLORS.purchase
          ),
          borderWidth: 0,
          stack: 'cashflow',
          yAxisID: 'y',
          order: 1
        },
        {
          label: 'Coupon payments',
          data: couponData,
          backgroundColor: COLORS.coupon,
          borderWidth: 0,
          stack: 'cashflow',
          yAxisID: 'y',
          order: 1
        },
        // YTM horizontal line
        ...(ytmBEY !== null ? [{
          label: 'Yield to maturity (r)',
          data: labels.map(() => ytmBEY * 100),
          type: 'line',
          borderColor: COLORS.yield,
          borderWidth: 3,
          borderDash: [5, 5],
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
          yAxisID: 'y2',
          order: 0
        }] : [])
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      onHover: (event, activeElements) => {
        if (isKeyboardMode && document.activeElement === canvas) return;

        if (activeElements.length > 0) {
          const index = activeElements[0].index;
          announceDataPoint(cashFlows[index], totalData[index], ytmBEY);
        }
      },
      plugins: {
        title: {
          display: false
        },
        legend: {
          display: false
        },
        tooltip: {
          usePointStyle: true,
          callbacks: {
            title: (context) => {
              const index = context[0].dataIndex;
              return `Time: ${cashFlows[index].timeYears.toFixed(1)} years`;
            },
            label: (context) => {
              const value = context.parsed.y;
              const index = context.dataIndex;
              const isInitialPeriod = index === 0;
              
              if (context.dataset.label === 'Yield to maturity (r)') {
                return `Yield to maturity (r): ${formatPercentage(value)}`;
              }
              
              if (isInitialPeriod && context.dataset.label === 'Principal/Purchase') {
                return `Bond price (PV): ${formatCurrency(value, true)}`;
              }
              
              if (context.dataset.label === 'Principal/Purchase' && value > 0) {
                return `Face value (FV): ${formatCurrency(value, true)}`;
              }
              if (context.dataset.label === 'Coupon payments') {
                return `Coupon payment: ${formatCurrency(value, true)}`;
              }
              
              return `${context.dataset.label}: ${formatCurrency(value, true)}`;
            },
            footer: (context) => {
              const index = context[0].dataIndex;
              const total = totalData[index];
              if (context[0].dataset.label !== 'Yield-to-maturity (r)') {
                return `Total: ${formatCurrency(total, true)}`;
              }
              return '';
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Years',
            color: COLORS.axisColor,
            font: {
              weight: 600
            }
          },
          ticks: {
            color: COLORS.axisColor,
            font: {
              weight: 500
            }
          },
          grid: {
            display: false
          }
        },
        y: {
          title: {
            display: true,
            text: 'Cash Flows (USD)',
            color: COLORS.axisColor,
            font: {
              weight: 600
            }
          },
          position: 'left',
          ticks: {
            callback: function(value) {
              // Return just the number without USD
              return value.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              });
            },
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0,
            color: COLORS.axisColor,
            font: {
              weight: 500
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        y2: {
          title: {
            display: true,
            text: 'Yield-to-maturity (%)',
            color: COLORS.yield,
            font: {
              weight: 600
            }
          },
          position: 'right',
          min: 0,
          max: ytmBEY ? Math.max(15, (ytmBEY * 100) * 1.3) : 15,
          ticks: {
            callback: function(value) {
              // Return just the number without %
              return value.toFixed(1);
            },
            color: COLORS.yield,
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0,
            font: {
              weight: 600
            }
          },
          grid: {
            display: false
          }
        }
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: showLabels ? 45 : 15,
          bottom: 10
        }
      }
    },
    plugins: [{
      id: 'stackedBarLabels',
      afterDatasetsDraw: (chart) => {
        if (!showLabels) return;
        
        const ctx = chart.ctx;
        ctx.save();
        
        const meta0 = chart.getDatasetMeta(0);
        const meta1 = chart.getDatasetMeta(1);
        
        // Find the top of the FV bar (last period) for label positioning
        const lastIndex = cashFlows.length - 1;
        let labelY = chart.scales.y.top;
        
        if (meta0.data[lastIndex] && meta1.data[lastIndex]) {
          // Get the top of the FV bar
          const fvBarTop = Math.min(meta0.data[lastIndex].y, meta1.data[lastIndex].y);
          // Position labels 25 pixels above the FV bar
          labelY = fvBarTop - 25;
        }
        
        chart.data.labels.forEach((label, index) => {
          const total = totalData[index];
          const cf = cashFlows[index];
          
          if (!meta0.data[index] || !meta1.data[index]) return;
          
          const bar0 = meta0.data[index];
          const bar1 = meta1.data[index];
          const x = bar1.x;
          
          // For period 0 (PV) and final period (FV), show white text on bars
          if (index === 0) {
            // PV - white text on orange bar
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const barMidY = (bar0.y + bar0.base) / 2;
            ctx.fillText('PV', x, barMidY);
          } else if (index === cashFlows.length - 1) {
            // FV - white text on teal bar
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const barMidY = (bar0.y + bar0.base) / 2;
            ctx.fillText('FV', x, barMidY);
          }
          
          // Show value labels above all bars (aligned at same height, above FV bar)
          if (Math.abs(total) >= 0.01) {
            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = COLORS.darkText;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            
            ctx.fillText(formatCurrency(total, false), x, labelY);
          }
        });
        
        ctx.restore();
      }
    },
    {
      id: 'keyboardFocus',
      afterDatasetsDraw: (chart) => {
        if (document.activeElement !== canvas) return;
        
        const ctx = chart.ctx;
        const meta0 = chart.getDatasetMeta(0);
        const meta1 = chart.getDatasetMeta(1);
        
        if (!meta0.data[currentFocusIndex] || !meta1.data[currentFocusIndex]) return;
        
        const bar0 = meta0.data[currentFocusIndex];
        const bar1 = meta1.data[currentFocusIndex];
        
        const allYValues = [bar0.y, bar0.base, bar1.y, bar1.base];
        const topY = Math.min(...allYValues);
        const bottomY = Math.max(...allYValues);
        
        ctx.save();
        ctx.strokeStyle = COLORS.darkText;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        
        const x = bar1.x - bar1.width / 2 - 4;
        const y = topY - 4;
        const width = bar1.width + 8;
        const height = bottomY - topY + 8;
        
        ctx.strokeRect(x, y, width, height);
        ctx.restore();
      }
    },
    {
      id: 'ytmLineLabel',
      afterDatasetsDraw: (chart) => {
        if (!ytmBEY) return;
        
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(2); // YTM line is dataset index 2
        
        if (!meta || !meta.data || meta.data.length === 0) return;
        
        ctx.save();
        ctx.fillStyle = COLORS.yield;
        ctx.font = 'italic bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Position label in the middle of the line, above it
        const middleIndex = Math.floor(meta.data.length / 2);
        const middlePoint = meta.data[middleIndex];
        
        if (middlePoint) {
          const x = middlePoint.x;
          const y = middlePoint.y - 8; // 8px above the line
          // Display the actual YTM value instead of just "r"
          ctx.fillText(`r = ${formatPercentage(ytmBEY * 100)}`, x, y);
        }
        
        ctx.restore();
      }
    }]
  });
  
  setupKeyboardNavigation(canvas, cashFlows, totalData, ytmBEY);
}

/**
 * Setup keyboard navigation
 */
function setupKeyboardNavigation(canvas, cashFlows, totalData, ytmBEY) {
  const oldListener = canvas._keydownListener;
  if (oldListener) {
    canvas.removeEventListener('keydown', oldListener);
  }
  
  const keydownListener = (e) => {
    const maxIndex = cashFlows.length - 1;
    let newIndex = currentFocusIndex;
    
    isKeyboardMode = true;
    
    switch(e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(currentFocusIndex + 1, maxIndex);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(currentFocusIndex - 1, 0);
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = maxIndex;
        break;
      default:
        return;
    }
    
    if (newIndex !== currentFocusIndex) {
      currentFocusIndex = newIndex;
      chartInstance.update('none');
      announceDataPoint(cashFlows[currentFocusIndex], totalData[currentFocusIndex], ytmBEY);
      showTooltipAtIndex(currentFocusIndex);
    }
  };
  
  canvas._keydownListener = keydownListener;
  canvas.addEventListener('keydown', keydownListener);
  
  const focusListener = () => {
    isKeyboardMode = true;
    showTooltipAtIndex(currentFocusIndex);
    announceDataPoint(cashFlows[currentFocusIndex], totalData[currentFocusIndex], ytmBEY);
  };
  
  const blurListener = () => {
    chartInstance.tooltip.setActiveElements([], {x: 0, y: 0});
    chartInstance.update('none');
  };
  
  canvas._focusListener = focusListener;
  canvas._blurListener = blurListener;
  canvas.addEventListener('focus', focusListener);
  canvas.addEventListener('blur', blurListener);
  
  const mouseMoveListener = () => {
    isKeyboardMode = false;
  };
  
  canvas._mouseMoveListener = mouseMoveListener;
  canvas.addEventListener('mousemove', mouseMoveListener);
}

/**
 * Show tooltip at a specific data index
 */
function showTooltipAtIndex(index) {
  if (!chartInstance) return;
  
  const meta0 = chartInstance.getDatasetMeta(0);
  const meta1 = chartInstance.getDatasetMeta(1);
  
  if (!meta0.data[index] || !meta1.data[index]) return;
  
  chartInstance.tooltip.setActiveElements([
    {datasetIndex: 0, index: index},
    {datasetIndex: 1, index: index}
  ], {
    x: meta1.data[index].x,
    y: meta1.data[index].y
  });
  
  chartInstance.update('none');
}

/**
 * Announce data point for screen readers
 */
function announceDataPoint(cashFlow, total, ytmBEY) {
  let liveRegion = document.getElementById('chart-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'chart-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }
  
  const isInitialPeriod = cashFlow.period === 0;
  const principalLabel = isInitialPeriod ? 'Bond price (PV)' : 'Face value (FV)';
  
  const announcement = `Time ${cashFlow.timeYears.toFixed(1)} years. ` +
    `Yield to maturity (r): ${ytmBEY ? formatPercentage(ytmBEY * 100) : '0%'}. ` +
    `Coupon payment: ${formatCurrency(cashFlow.couponPayment, true)}. ` +
    `${principalLabel}: ${formatCurrency(cashFlow.principalPayment, true)}. ` +
    `Total: ${formatCurrency(total, true)}.`;
  
  liveRegion.textContent = announcement;
}

/**
 * Check if labels should be shown based on viewport
 */
export function shouldShowLabels() {
  return window.innerWidth > 860;
}

/**
 * Cleanup chart resources
 */
export function destroyChart() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}