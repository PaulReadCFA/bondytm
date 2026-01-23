/**
 * Dynamic Equation Module
 * Renders Bond YTM equation with actual calculated values
 */

import { formatCurrency, formatPercentage } from './utils.js';

/**
 * Render dynamic equation with user's values
 * @param {Object} calculations - YTM calculations
 * @param {Object} params - Input parameters
 */
export function renderDynamicEquation(calculations, params) {
  const container = document.getElementById('dynamic-mathml-equation');
  
  if (!container) {
    console.error('Dynamic equation container not found');
    return;
  }
  
  // Safety check - but allow small values close to zero
  if (!calculations || calculations.bondEquivalentYield === null || 
      calculations.bondEquivalentYield === undefined || 
      isNaN(calculations.bondEquivalentYield) ||
      calculations.couponPayment === null || 
      calculations.couponPayment === undefined ||
      isNaN(calculations.couponPayment)) {
    return;
  }
  
  // BEFORE rendering: Lock the equation container heights to prevent jumping
  const equationContainers = document.querySelectorAll('.equation-container');
  const heights = new Map();
  
  equationContainers.forEach(box => {
    // Store the current computed height
    const currentHeight = box.getBoundingClientRect().height;
    heights.set(box, currentHeight);
    // Lock the height temporarily
    box.style.height = `${currentHeight}px`;
    box.style.minHeight = `${currentHeight}px`;
    box.style.maxHeight = `${currentHeight}px`;
    box.style.overflow = 'hidden';
  });
  
  const { bondEquivalentYield, couponPayment, periods } = calculations;
  const { bondPrice, faceValue } = params;
  
  // Format values for display
  const ytmFormatted = formatPercentage(bondEquivalentYield * 100);
  const priceFormatted = formatCurrency(bondPrice);
  const couponSemiannualFormatted = formatCurrency(couponPayment); // Per-period (semiannual)
  const fvFormatted = formatCurrency(faceValue);
  const periodicYield = bondEquivalentYield / 2; // Semiannual
  const yFormatted = formatPercentage(periodicYield * 100);
  
  // Build MathML equation - Annuity formula with semiannual compounding
  // PV = C/(r/2) × [1 - 1/(1+r/2)^n] + FV/(1+r/2)^n
  // where C is the semiannual coupon payment, r is the annual yield, n is number of periods
  const mathML = `
    <div class="equation-math-wrapper">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mrow>
          <mi mathvariant="bold" mathcolor="#b95b1d">${priceFormatted}</mi>
          <mo>=</mo>
          <mfrac linethickness="1.2px">
            <mi mathvariant="bold" mathcolor="#3c6ae5">${couponSemiannualFormatted}</mi>
            <mfrac linethickness="1.2px">
              <mi mathcolor="#7a46ff">r</mi>
              <mn>2</mn>
            </mfrac>
          </mfrac>
          <mo>×</mo>
          <mrow>
            <mo>[</mo>
            <mn>1</mn>
            <mo>−</mo>
            <mfrac linethickness="1.2px">
              <mn>1</mn>
              <msup>
                <mrow>
                  <mo>(</mo>
                  <mn>1</mn>
                  <mo>+</mo>
                  <mfrac linethickness="1.2px">
                    <mi mathcolor="#7a46ff">r</mi>
                    <mn>2</mn>
                  </mfrac>
                  <mo>)</mo>
                </mrow>
                <mn mathcolor="#15803d">${periods}</mn>
              </msup>
            </mfrac>
            <mo>]</mo>
          </mrow>
          <mo>+</mo>
          <mfrac linethickness="1.2px">
            <mi mathvariant="bold" mathcolor="#0079a6">${fvFormatted}</mi>
            <msup>
              <mrow>
                <mo>(</mo>
                <mn>1</mn>
                <mo>+</mo>
                <mfrac linethickness="1.2px">
                  <mi mathcolor="#7a46ff">r</mi>
                  <mn>2</mn>
                </mfrac>
                <mo>)</mo>
              </mrow>
              <mn mathcolor="#15803d">${periods}</mn>
            </msup>
          </mfrac>
        </mrow>
      </math>
    </div>
    <div class="equation-explanation">
      <div>Solving for <span style="color: #7a46ff;"><strong><i>r</i></strong></span> gives: <span style="color: #7a46ff;"><strong>yield-to-maturity</strong></span> = ${ytmFormatted} annualized (${yFormatted} semiannual)</div>
    </div>
  `;
  
  container.innerHTML = mathML;
  
  // Trigger MathJax to render the equation
  if (typeof MathJax !== 'undefined' && MathJax.Hub) {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, container], function() {
      // Remove tabindex from MathJax elements for accessibility
      setTimeout(function() {
        const mathJaxElements = document.querySelectorAll('.MathJax[tabindex]');
        mathJaxElements.forEach(function(el) {
          el.removeAttribute('tabindex');
        });
      }, 10);
      
      // AFTER rendering: Release height lock and let boxes resize naturally
      setTimeout(function() {
        equationContainers.forEach(box => {
          box.style.height = '';
          box.style.minHeight = '';
          box.style.maxHeight = '';
          box.style.overflow = '';
        });
      }, 200);
    });
  }
  
  // Create screen-reader friendly announcement
  const announcement = `Bond price ${priceFormatted} equals the annuity formula for semiannual coupon payments. ` +
    `Semiannual coupon payment ${couponSemiannualFormatted} divided by semiannual rate, ` +
    `times the annuity factor, plus face value ${fvFormatted} discounted to present. ` +
    `Solving for the yield gives yield-to-maturity of ${ytmFormatted} annualized, or ${yFormatted} semiannual.`;
  
  // Update aria-live region for screen readers
  let liveRegion = document.getElementById('equation-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'equation-live-region';
    liveRegion.className = 'sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveRegion);
  }
  liveRegion.textContent = announcement;
}