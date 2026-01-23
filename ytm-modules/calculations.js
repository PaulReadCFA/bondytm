/**
 * Bond YTM Calculations Module
 * Pure functions for yield to maturity calculations using numerical methods
 */

/**
 * Calculate bond yield to maturity using bisection method
 * 
 * @param {Object} params - Bond parameters
 * @param {number} params.bondPrice - Current bond price
 * @param {number} params.couponPayment - Annual coupon payment (dollars)
 * @param {number} params.years - Years to maturity
 * @param {number} params.faceValue - Face value of the bond
 * @param {number} params.frequency - Payment frequency per year (2 for semiannual)
 * @returns {Object} YTM calculation results
 */
export function calculateYTM({ bondPrice, couponPayment, years, faceValue, frequency }) {
  // Ensure all inputs are numbers
  bondPrice = Number(bondPrice);
  couponPayment = Number(couponPayment);
  years = Number(years);
  faceValue = Number(faceValue);
  frequency = Number(frequency);
  
  const periods = years * frequency;
  const couponPaymentPerPeriod = couponPayment / frequency; // Convert annual to periodic
  
  // Build cash flow array
  const cashFlows = [];
  for (let i = 0; i < periods; i++) {
    if (i === periods - 1) {
      // Last period includes coupon + face value
      cashFlows.push(couponPaymentPerPeriod + faceValue);
    } else {
      cashFlows.push(couponPaymentPerPeriod);
    }
  }
  
  // Present value function for a given yield
  const presentValue = (yieldPerPeriod) => {
    return cashFlows.reduce((pv, cf, t) => {
      return pv + cf / Math.pow(1 + yieldPerPeriod, t + 1);
    }, 0);
  };
  
  // Bisection method to find YTM
  let low = 0;
  let high = 1.0; // 100% per period as upper bound
  let iterations = 0;
  const maxIterations = 200;
  const tolerance = 0.0000001;
  
  while (iterations < maxIterations && (high - low) > tolerance) {
    const mid = (low + high) / 2;
    const pv = presentValue(mid);
    
    if (pv > bondPrice) {
      // Price too high, yield too low, increase yield
      low = mid;
    } else {
      // Price too low, yield too high, decrease yield
      high = mid;
    }
    
    iterations++;
  }
  
  const yieldPerPeriod = (low + high) / 2;
  
  // Convert periodic yield to annual yields
  const bondEquivalentYield = yieldPerPeriod * frequency; // BEY (simple annualization)
  const effectiveAnnualYield = Math.pow(1 + yieldPerPeriod, frequency) - 1; // EAY (compound)
  
  return {
    yieldPerPeriod,
    bondEquivalentYield,
    effectiveAnnualYield,
    periods,
    couponPayment: couponPaymentPerPeriod, // Per-period payment for display
    cashFlows,
    iterations
  };
}

/**
 * Generate cash flow schedule for the bond
 * @param {Object} params - Bond parameters and calculated values
 * @returns {Array} Array of cash flow objects
 */
export function generateCashFlows({ bondPrice, faceValue, frequency, years, couponPayment, ytmPerPeriod }) {
  const periods = years * frequency;
  const cashFlows = [];
  
  // Period 0: Initial purchase (negative cash flow)
  cashFlows.push({
    period: 0,
    timeYears: 0,
    couponPayment: 0,
    principalPayment: -bondPrice,
    totalCashFlow: -bondPrice
  });
  
  // Periodic cash flows
  for (let t = 1; t <= periods; t++) {
    const timeYears = t / frequency;
    const coupon = couponPayment;
    const principal = (t === periods) ? faceValue : 0;
    const total = coupon + principal;
    
    cashFlows.push({
      period: t,
      timeYears,
      couponPayment: coupon,
      principalPayment: principal,
      totalCashFlow: total
    });
  }
  
  return cashFlows;
}

/**
 * Determine bond pricing relationship (premium, discount, par)
 * @param {number} bondPrice - Current bond price
 * @param {number} faceValue - Face value
 * @returns {Object} Bond pricing type
 */
export function analyzeBondPricing(bondPrice, faceValue) {
  const difference = bondPrice - faceValue;
  const tolerance = 0.01;
  
  if (Math.abs(difference) < tolerance) {
    return {
      type: 'par',
      description: 'Trading at par',
      detail: 'Price equals face value'
    };
  } else if (difference > 0) {
    return {
      type: 'premium',
      description: 'Trading at premium',
      detail: 'Price > Par'
    };
  } else {
    return {
      type: 'discount',
      description: 'Trading at discount',
      detail: 'Price < Par'
    };
  }
}

/**
 * Calculate all bond YTM metrics
 * @param {Object} params - Input parameters from state
 * @returns {Object} Complete YTM calculations
 */
export function calculateBondYTMMetrics(params) {
  const { bondPrice, couponPayment, years, faceValue, frequency } = params;
  
  // Calculate YTM
  const ytmData = calculateYTM({
    bondPrice,
    couponPayment,
    years,
    faceValue,
    frequency
  });
  
  // Generate cash flow schedule
  const cashFlows = generateCashFlows({
    bondPrice,
    faceValue,
    frequency,
    years,
    couponPayment: ytmData.couponPayment,
    ytmPerPeriod: ytmData.yieldPerPeriod
  });
  
  // Analyze bond pricing
  const pricingAnalysis = analyzeBondPricing(bondPrice, faceValue);
  
  return {
    ...ytmData,
    cashFlows,
    pricingAnalysis
  };
}