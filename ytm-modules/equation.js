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
  
  const { bondEquivalentYield, couponPayment, periods } = calculations;
  const { bondPrice, faceValue } = params;
  
  // Format values for display
  const ytmFormatted = formatPercentage(bondEquivalentYield * 100);
  const priceFormatted = formatCurrency(bondPrice);
  const couponAnnualFormatted = formatCurrency(couponPayment * 2); // Annual coupon (2x semiannual)
  const fvFormatted = formatCurrency(faceValue);
  const periodicYield = bondEquivalentYield / 2; // Semiannual
  const yFormatted = formatPercentage(periodicYield * 100);
  
  // Build MathML equation - Annuity formula with semiannual compounding
  // PV = PMT/r × [1 - 1/(1+r/2)^n] + FV/(1+r/2)^n
  // where PMT is the ANNUAL coupon payment, r is the ANNUAL yield, n is number of periods
  const mathML = `
    <div class="equation-math-wrapper">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mrow>
          <mi mathvariant="bold" mathcolor="#b95b1d">${priceFormatted}</mi>
          <mo>=</mo>
          <mfrac linethickness="1.2px">
            <mi mathvariant="bold" mathcolor="#3c6ae5">${couponAnnualFormatted}</mi>
            <mi mathcolor="#7a46ff">r</mi>
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
      <div>Solving iteratively for <span style="color: #7a46ff;"><strong><i>r</i></strong></span> gives: <span style="color: #7a46ff;"><strong>yield-to-maturity</strong></span> = ${ytmFormatted} annualized (${yFormatted} semiannual)</div>
    </div>
  `;
  
  container.innerHTML = mathML;
  
  // Trigger MathJax to render the equation
  if (typeof MathJax !== 'undefined' && MathJax.Hub) {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, container], function() {
      // Remove tabindex and overflow from MathJax elements for accessibility
      const mathJaxElements = document.querySelectorAll('.MathJax');
      mathJaxElements.forEach(function(el) {
        el.removeAttribute('tabindex');
        el.style.setProperty('overflow', 'visible', 'important');
        el.style.setProperty('overflow-x', 'visible', 'important');
        el.style.setProperty('overflow-y', 'visible', 'important');
        el.style.setProperty('max-width', 'none', 'important');
        
        const childrenWithOverflow = el.querySelectorAll('*');
        childrenWithOverflow.forEach(child => {
          child.style.setProperty('overflow', 'visible', 'important');
          child.style.setProperty('overflow-x', 'visible', 'important');
          child.style.setProperty('overflow-y', 'visible', 'important');
        });
      });

      // Update the container's aria-label to include the result so screen reader
      // users hear something meaningful when tabbing to the equation on first load
      const equationContainer = document.getElementById('dynamic-equation-container');
      if (equationContainer) {
        equationContainer.setAttribute(
          'aria-label',
          `Bond pricing equation with your values. Yield-to-maturity = ${ytmFormatted} annualized (${yFormatted} semiannual).`
        );
      }
    });
  }
}