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
  
  const { bondEquivalentYield, couponPayment, periods } = calculations;
  const { bondPrice, faceValue } = params;
  
  // Format values for display
  const ytmFormatted = formatPercentage(bondEquivalentYield * 100);
  const priceFormatted = formatCurrency(bondPrice);
  const couponFormatted = formatCurrency(couponPayment);
  const fvFormatted = formatCurrency(faceValue);
  const periodicYield = bondEquivalentYield / 2; // Semiannual
  const yFormatted = formatPercentage(periodicYield * 100);
  
  // Build MathML equation
  // P₀ = Σ(C/(1+y)^t) + FV/(1+y)^n
  const mathML = `
    <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
      <mrow>
        <msub>
          <mi mathcolor="#b95b1d">P</mi>
          <mn mathcolor="#b95b1d">0</mn>
        </msub>
        <mo>=</mo>
        <munderover>
          <mo>∑</mo>
          <mrow><mi>t</mi><mo>=</mo><mn>1</mn></mrow>
          <mn mathcolor="#15803d">${periods}</mn>
        </munderover>
        <mfrac linethickness="1.2px">
          <mi mathvariant="bold" mathcolor="#3c6ae5">${couponFormatted}</mi>
          <msup>
            <mrow><mo>(</mo><mn>1</mn><mo>+</mo><mi mathcolor="#15803d">y</mi><mo>)</mo></mrow>
            <mi>t</mi>
          </msup>
        </mfrac>
        <mo>+</mo>
        <mfrac linethickness="1.2px">
          <mi mathvariant="bold" mathcolor="#b35b21">${fvFormatted}</mi>
          <msup>
            <mrow><mo>(</mo><mn>1</mn><mo>+</mo><mi mathcolor="#15803d">y</mi><mo>)</mo></mrow>
            <mn mathcolor="#15803d">${periods}</mn>
          </msup>
        </mfrac>
      </mrow>
    </math>
    <div style="text-align: center; margin-top: 0.5rem; font-size: 0.875rem; color: #374151;">
      <div>Where: <span style="color: #b95b1d;"><strong>P₀</strong></span> = ${priceFormatted}, 
      <span style="color: #3c6ae5;"><strong>C</strong></span> = ${couponFormatted}, 
      <span style="color: #15803d;"><strong>y</strong></span> = ${yFormatted} (semiannual)</div>
      <div style="margin-top: 0.25rem;">Solving for y gives: <span style="color: #15803d;"><strong>YTM</strong></span> = ${ytmFormatted} (annualized)</div>
    </div>
  `;
  
  container.innerHTML = mathML;
  
  // Create screen-reader friendly announcement
  const announcement = `Bond price ${priceFormatted} equals the sum of discounted coupon payments plus discounted face value. ` +
    `Coupon payment is ${couponFormatted} per period for ${periods} periods. ` +
    `Face value ${fvFormatted} is received at maturity. ` +
    `Solving for the yield gives YTM of ${ytmFormatted}.`;
  
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
