export function calculateInvestmentVsMortgage(investment, mortgageData, mortgageResults) {
  if (!mortgageResults || !investment.amount) return null;

  const investmentAmount = investment.amount;
  const annualReturn = investment.annualReturn / 100;
  const dividendYield = investment.dividendYield / 100 || 0;
  const taxRate = investment.taxRate / 100 || 0;
  
  // Calculate mortgage term in years (use remaining term from results)
  const mortgageTermYears = mortgageResults.actualTermMonths / 12;
  
  // Calculate what happens if we invest the money instead of paying mortgage
  const investmentResult = calculateInvestmentGrowth(
    investmentAmount, 
    annualReturn, 
    dividendYield, 
    taxRate, 
    mortgageTermYears,
    investment.type
  );
  
  // Calculate what happens if we put the money toward mortgage
  const mortgageSavings = calculateMortgagePaymentBenefit(
    investmentAmount,
    mortgageData,
    mortgageResults
  );
  
  const netDifference = investmentResult.totalValue - mortgageSavings;
  const investmentBetter = netDifference > 0;
  
  return {
    investmentValue: investmentResult.totalValue,
    capitalGrowth: investmentResult.capitalGrowth,
    dividendValue: investmentResult.dividendValue,
    mortgageSavings,
    netDifference,
    investmentBetter,
    breakEvenReturn: calculateBreakEvenReturn(mortgageData, mortgageSavings, investmentAmount, mortgageTermYears)
  };
}

function calculateInvestmentGrowth(principal, annualReturn, dividendYield, taxRate, years, investmentType) {
  let investmentValue = principal;
  let totalDividendsReceived = 0;
  let totalCapitalGrowth = 0;
  
  for (let year = 1; year <= years; year++) {
    // Calculate dividend/income for this year (based on current value)
    const yearlyDividend = investmentValue * dividendYield;
    
    // Calculate capital growth for this year
    const capitalGrowth = investmentValue * annualReturn;
    investmentValue += capitalGrowth;
    totalCapitalGrowth += capitalGrowth;
    
    // Handle dividends based on investment type
    if (investmentType === 'shares' || investmentType === 'etf') {
      // Reinvest dividends after tax
      const afterTaxDividend = yearlyDividend * (1 - taxRate);
      investmentValue += afterTaxDividend;
      totalDividendsReceived += yearlyDividend;
    } else if (investmentType === 'property') {
      // Property rental income - typically not reinvested into the property
      const afterTaxIncome = yearlyDividend * (1 - taxRate);
      totalDividendsReceived += afterTaxIncome; // Keep as cash
    } else {
      // Other investments - dividends/interest received as cash
      const afterTaxIncome = yearlyDividend * (1 - taxRate);
      totalDividendsReceived += afterTaxIncome;
    }
  }
  
  // Calculate capital gains tax on the growth
  const totalCapitalGains = totalCapitalGrowth;
  let capitalGainsTax = 0;
  
  // Apply capital gains tax (typically lower rate or discount)
  if (totalCapitalGains > 0) {
    // Assume 50% CGT discount for assets held > 1 year (Australian system)
    const discountedGains = investmentType === 'crypto' ? totalCapitalGains : totalCapitalGains * 0.5;
    capitalGainsTax = discountedGains * taxRate;
  }
  
  // Calculate after-tax dividend value
  const afterTaxDividends = totalDividendsReceived * (1 - taxRate);
  
  // Final values
  const finalCapitalValue = principal + totalCapitalGrowth - capitalGainsTax;
  const finalDividendValue = investmentType === 'shares' || investmentType === 'etf' ? 0 : afterTaxDividends; // For shares, dividends are reinvested
  const totalValue = finalCapitalValue + finalDividendValue;
  
  return {
    totalValue: Math.max(totalValue, 0),
    capitalGrowth: Math.max(finalCapitalValue - principal, 0),
    dividendValue: investmentType === 'shares' || investmentType === 'etf' ? afterTaxDividends : finalDividendValue
  };
}

function calculateMortgagePaymentBenefit(extraPayment, mortgageData, mortgageResults) {
  // More accurate calculation using the mortgage interest rate
  const annualRate = mortgageData.interestRate / 100;
  const monthlyRate = annualRate / 12;
  const remainingMonths = mortgageResults.actualTermMonths;
  
  // Calculate the present value of interest savings
  // This extra payment would save interest at the mortgage rate
  let totalInterestSaved = 0;
  let remainingBalance = extraPayment;
  
  // Simulate the interest saved over the remaining mortgage term
  for (let month = 0; month < remainingMonths && remainingBalance > 0; month++) {
    const monthlyInterestSaved = remainingBalance * monthlyRate;
    totalInterestSaved += monthlyInterestSaved;
    
    // The balance reduces as we "pay down" the mortgage
    // This is a simplified model - in reality it's more complex
    const principalReduction = remainingBalance * (monthlyRate / (Math.pow(1 + monthlyRate, remainingMonths - month) - 1));
    remainingBalance = Math.max(0, remainingBalance - principalReduction);
  }
  
  // Total benefit is the original payment plus all interest saved
  return extraPayment + totalInterestSaved;
}

function calculateBreakEvenReturn(mortgageData, mortgageSavings, investmentAmount, years) {
  // Calculate what return rate would make investment equal to mortgage savings
  const requiredFinalValue = mortgageSavings;
  const requiredGrowthFactor = requiredFinalValue / investmentAmount;
  const breakEvenRate = Math.pow(requiredGrowthFactor, 1/years) - 1;
  
  return breakEvenRate * 100; // Convert to percentage
}

export function getInvestmentRecommendations(investment, comparison) {
  const recommendations = [];
  
  if (!comparison) return recommendations;
  
  // Risk vs Return analysis
  if (investment.type === 'shares' || investment.type === 'crypto') {
    recommendations.push({
      type: 'risk',
      message: 'Higher risk investment - consider your risk tolerance and investment timeline'
    });
  }
  
  if (investment.type === 'savings' || investment.type === 'term_deposit') {
    recommendations.push({
      type: 'conservative',
      message: 'Low risk option - guaranteed returns but may not beat mortgage interest rate'
    });
  }
  
  // Tax efficiency
  if (investment.taxRate > 20) {
    recommendations.push({
      type: 'tax',
      message: 'High tax rate - consider tax-efficient investment structures or salary sacrificing'
    });
  }
  
  // Return analysis
  if (comparison.investmentBetter && comparison.netDifference > 10000) {
    recommendations.push({
      type: 'positive',
      message: 'Strong case for investing - significant potential upside over mortgage payments'
    });
  } else if (!comparison.investmentBetter && Math.abs(comparison.netDifference) < 5000) {
    recommendations.push({
      type: 'neutral',
      message: 'Close call - consider non-financial factors like peace of mind from debt reduction'
    });
  }
  
  // Diversification
  recommendations.push({
    type: 'diversification',
    message: 'Consider splitting funds between investments and mortgage payments for balanced approach'
  });
  
  return recommendations;
}