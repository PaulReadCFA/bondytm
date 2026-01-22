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
  
  // STEP 1: BEFORE rendering - Lock height to prevent jumping
  const equationCard = document.getElementById('dynamic-equation-container');
  if (equationCard) {
    const currentHeight = equationCard.getBoundingClientRect().height;
    // Triple-lock the height (prevents any flex/shrink)
    equationCard.style.height = `${currentHeight}px`;
    equationCard.style.minHeight = `${currentHeight}px`;
    equationCard.style.maxHeight = `${currentHeight}px`;
    equationCard.style.overflow = 'hidden';
  }
  
  const { bondEquivalentYield, couponPayment, periods } = calculations;
  const { bondPrice, faceValue, couponRate } = params;
  
  // Format values for display
  const ytmFormatted = formatPercentage(bondEquivalentYield * 100);
  const priceFormatted = formatCurrency(bondPrice);
  const couponFormatted = formatCurrency(couponPayment);
  const fvFormatted = formatCurrency(faceValue);
  const periodicYield = bondEquivalentYield / 2; // Semiannual
  const yFormatted = formatPercentage(periodicYield * 100);
  
  // Annual PMT (full coupon rate * face value)
  const annualPMT = (couponRate / 100) * faceValue;
  const annualPMTFormatted = formatCurrency(annualPMT);
  
  // Years (T)
  const years = periods / 2;
  
  // STEP 2: Build MathML equation using the semi-annual formulation
  // PV_coupon bond = PMT/r × [1 - 1/(1+r/2)^(2T)] + FV/(1+r/2)^(2T)
  const mathML = `
    <div class="equation-math-wrapper">
      <math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
        <mrow>
          <msub>
            <mi mathvariant="bold" mathcolor="#b95b1d">PV</mi>
            <mtext mathcolor="#b95b1d">Coupon bond</mtext>
          </msub>
          <mo>=</mo>
          <mfrac linethickness="1.2px">
            <mi mathvariant="bold" mathcolor="#3c6ae5">${annualPMTFormatted}</mi>
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
                <mrow><mo>(</mo><mn>1</mn><mo>+</mo><mi mathcolor="#7a46ff">r</mi><mo>/</mo><mn>2</mn><mo>)</mo></mrow>
                <mrow><mn>2</mn><mo>×</mo><mn mathcolor="#15803d">${years}</mn></mrow>
              </msup>
            </mfrac>
            <mo>]</mo>
          </mrow>
          <mo>+</mo>
          <mfrac linethickness="1.2px">
            <mi mathvariant="bold" mathcolor="#0079a6">${fvFormatted}</mi>
            <msup>
              <mrow><mo>(</mo><mn>1</mn><mo>+</mo><mi mathcolor="#7a46ff">r</mi><mo>/</mo><mn>2</mn><mo>)</mo></mrow>
              <mrow><mn>2</mn><mo>×</mo><mn mathcolor="#15803d">${years}</mn></mrow>
            </msup>
          </mfrac>
        </mrow>
      </math>
    </div>
    <div class="equation-explanation">
      <div>Where: <span style="color: #b95b1d;"><strong>PV<sub>Coupon bond</sub></strong></span> = ${priceFormatted}, 
      <span style="color: #3c6ae5;"><strong>PMT</strong></span> = ${annualPMTFormatted} (annual), 
      <span style="color: #0079a6;"><strong>FV</strong></span> = ${fvFormatted},
      <span style="color: #15803d;"><strong>T</strong></span> = ${years} years</div>
      <div style="margin-top: 0.25rem;">Solving for r gives: <span style="color: #7a46ff;"><strong>yield to maturity (r)</strong></span> = ${ytmFormatted} (annualized)</div>
    </div>
  `;
  
  container.innerHTML = mathML;
  
  // STEP 3: Trigger MathJax to process
  if (typeof MathJax !== 'undefined' && MathJax.Hub) {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, container], function() {
      // STEP 4: AFTER MathJax completes - Release the height lock
      // Wait 200ms to ensure MathJax is fully done
      setTimeout(function() {
        if (equationCard) {
          equationCard.style.height = '';
          equationCard.style.minHeight = '';
          equationCard.style.maxHeight = '';
          equationCard.style.overflow = '';
        }
      }, 200);
    });
  } else {
    // If MathJax not available, unlock immediately
    if (equationCard) {
      equationCard.style.height = '';
      equationCard.style.minHeight = '';
      equationCard.style.maxHeight = '';
      equationCard.style.overflow = '';
    }
  }
  
  // Create screen-reader friendly announcement
  const announcement = `Bond price ${priceFormatted} equals the present value of coupon payments plus discounted face value. ` +
    `Annual coupon payment is ${annualPMTFormatted}. ` +
    `Face value ${fvFormatted} is received at maturity in ${years} years. ` +
    `Solving for the yield gives yield to maturity of ${ytmFormatted}.`;
  
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