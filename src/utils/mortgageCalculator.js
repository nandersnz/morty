export function calculateMortgage(mortgageData, timelineEvents) {
  const { principal, interestRate, termYears, termMonths, startDate, offsetBalance, paymentDay, interestDay, isExistingMortgage } = mortgageData;
  
  // Calculate total term in months
  const totalTermMonths = (termYears * 12) + (termMonths || 0);
  
  // Function to calculate minimum payment using daily compounding
  const calculateMinimumPayment = (loanAmount, annualRate, termInMonths) => {
    if (annualRate === 0) return loanAmount / termInMonths;
    
    const dailyRate = (annualRate / 100) / 365;
    const effectiveMonthlyRate = Math.pow(1 + dailyRate, 365/12) - 1;
    
    const monthlyPayment = loanAmount * 
      (effectiveMonthlyRate * Math.pow(1 + effectiveMonthlyRate, termInMonths)) /
      (Math.pow(1 + effectiveMonthlyRate, termInMonths) - 1);
    
    return monthlyPayment;
  };
  
  // Initialize the three distinct pools
  let amortizedPrincipal = principal;           // The "official" loan balance
  let redrawOffsetPool = offsetBalance || 0;    // The liquid capital pool
  
  const originalMinimumPayment = calculateMinimumPayment(principal, interestRate, totalTermMonths);
  let currentMinimumPayment = originalMinimumPayment;
  let currentRate = interestRate;
  let currentMonthlyPayment = originalMinimumPayment;
  
  // Transaction ledger for complete audit trail
  const transactions = [];
  let totalInterestPaid = 0;
  let totalPaymentsMade = 0;
  let effectivePayoffDate = null;
  
  // Create initial state transaction
  transactions.push({
    date: startDate,
    type: 'Initial Loan',
    description: 'Mortgage loan originated',
    amount: 0,
    amortizedPrincipal: amortizedPrincipal,
    redrawOffsetPool: redrawOffsetPool,
    netInterestBearingBalance: amortizedPrincipal - redrawOffsetPool,
    rate: currentRate,
    minimumPayment: currentMinimumPayment
  });
  
  // Sort all events by effective date for temporal processing
  const allEvents = [...timelineEvents];
  
  // Add scheduled monthly payments and interest charges as separate events
  const startDateObj = new Date(startDate);
  for (let month = 1; month <= totalTermMonths; month++) {
    // Add payment event
    const paymentDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + month, paymentDay || 1);
    const paymentDateStr = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}-${String(paymentDay || 1).padStart(2, '0')}`;
    
    allEvents.push({
      date: paymentDateStr,
      type: 'scheduledPayment',
      value: currentMonthlyPayment,
      isSystemGenerated: true
    });
    
    // Add interest charge event - happens on different day as set in mortgage details
    const interestDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + month, interestDay || 9);
    const interestDateStr = `${interestDate.getFullYear()}-${String(interestDate.getMonth() + 1).padStart(2, '0')}-${String(interestDay || 9).padStart(2, '0')}`;
    
    allEvents.push({
      date: interestDateStr,
      type: 'scheduledInterestCharge',
      value: 0, // Will be calculated based on period and balance
      isSystemGenerated: true
    });
  }
  
  // Sort all events by effective date
  allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Process events chronologically
  for (const event of allEvents) {
    const eventDate = new Date(event.date);
    
    // Skip events before start date or if loan is paid off
    if (eventDate < new Date(startDate) || amortizedPrincipal <= 0.01) continue;
    
    // Process the event based on type
    switch (event.type) {
      case 'scheduledPayment':
        // Payment immediately affects the balance for future interest calculations
        const paymentAmount = currentMonthlyPayment;
        
        // WATERFALL PAYMENT LOGIC
        // Tier 1: Interest Coverage (if any outstanding)
        // Tier 2: Scheduled Principal (minimum payment requirement)
        const scheduledPrincipal = Math.min(paymentAmount, currentMinimumPayment, amortizedPrincipal);
        amortizedPrincipal -= scheduledPrincipal;
        
        // Tier 3: Redraw Credit (excess goes to liquid pool)
        const redrawCredit = paymentAmount - scheduledPrincipal;
        redrawOffsetPool += redrawCredit;
        
        totalPaymentsMade += paymentAmount;
        
        transactions.push({
          date: event.date,
          type: 'Monthly Payment',
          description: `Payment: ${scheduledPrincipal.toFixed(2)} principal + ${redrawCredit.toFixed(2)} redraw`,
          amount: -paymentAmount,
          amortizedPrincipal: amortizedPrincipal,
          redrawOffsetPool: redrawOffsetPool,
          netInterestBearingBalance: amortizedPrincipal - redrawOffsetPool,
          rate: currentRate,
          minimumPayment: currentMinimumPayment
        });
        break;
        
      case 'scheduledInterestCharge':
        // Calculate interest for the period and charge it on the interest day
        // Find the previous interest charge date to calculate the period
        const currentInterestDate = new Date(event.date);
        let previousInterestDate;
        
        // Find previous interest charge or start date
        const previousInterestTransaction = transactions
          .slice()
          .reverse()
          .find(t => t.type === 'Interest Charge' || t.type === 'Initial Loan');
        
        if (previousInterestTransaction) {
          if (previousInterestTransaction.type === 'Initial Loan') {
            previousInterestDate = new Date(startDate);
          } else {
            previousInterestDate = new Date(previousInterestTransaction.date);
          }
        } else {
          previousInterestDate = new Date(startDate);
        }
        
        // Calculate days in the interest period
        const daysDiff = Math.ceil((currentInterestDate - previousInterestDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 0) {
          // Calculate average net balance over the period by looking at all balance changes
          // For simplicity, we'll use the current net balance
          // (In a more sophisticated system, we'd calculate day-by-day)
          const netBalance = Math.max(0, amortizedPrincipal - redrawOffsetPool);
          const dailyRate = (currentRate / 100) / 365;
          const interestCharge = netBalance * dailyRate * daysDiff;
          
          if (interestCharge > 0.01) {
            amortizedPrincipal += interestCharge;
            totalInterestPaid += interestCharge;
            
            transactions.push({
              date: event.date,
              type: 'Interest Charge',
              description: `Interest for ${daysDiff} days at ${currentRate}% on ${netBalance.toFixed(2)}`,
              amount: interestCharge,
              amortizedPrincipal: amortizedPrincipal,
              redrawOffsetPool: redrawOffsetPool,
              netInterestBearingBalance: amortizedPrincipal - redrawOffsetPool,
              rate: currentRate,
              minimumPayment: currentMinimumPayment
            });
          }
        }
        break;
        
      case 'repaymentChange':
        currentMonthlyPayment = event.value;
        transactions.push({
          date: event.date,
          type: 'Payment Change',
          description: `Monthly payment changed to ${currentMonthlyPayment.toFixed(2)}, minimum remains ${currentMinimumPayment.toFixed(2)}`,
          amount: 0,
          amortizedPrincipal: amortizedPrincipal,
          redrawOffsetPool: redrawOffsetPool,
          netInterestBearingBalance: amortizedPrincipal - redrawOffsetPool,
          rate: currentRate,
          minimumPayment: currentMinimumPayment
        });
        break;
        
      case 'deposit':
        redrawOffsetPool += event.value;
        transactions.push({
          date: event.date,
          type: 'Deposit',
          description: `Deposit to redraw/offset pool`,
          amount: -event.value,
          amortizedPrincipal: amortizedPrincipal,
          redrawOffsetPool: redrawOffsetPool,
          netInterestBearingBalance: amortizedPrincipal - redrawOffsetPool,
          rate: currentRate,
          minimumPayment: currentMinimumPayment
        });
        break;
        
      case 'redraw':
        const redrawAmount = Math.min(event.value, redrawOffsetPool);
        const loanIncrease = event.value - redrawAmount;
        
        redrawOffsetPool -= redrawAmount;
        amortizedPrincipal += loanIncrease;
        
        transactions.push({
          date: event.date,
          type: 'Redraw',
          description: `Redraw: ${redrawAmount.toFixed(2)} from pool + ${loanIncrease.toFixed(2)} loan increase`,
          amount: event.value,
          amortizedPrincipal: amortizedPrincipal,
          redrawOffsetPool: redrawOffsetPool,
          netInterestBearingBalance: amortizedPrincipal - redrawOffsetPool,
          rate: currentRate,
          minimumPayment: currentMinimumPayment
        });
        break;
        
      case 'rateChange':
        currentRate = event.value;
        // Recalculate minimum payment with remaining term
        const remainingMonths = totalTermMonths - Math.ceil((eventDate - startDateObj) / (1000 * 60 * 60 * 24 * 30));
        if (remainingMonths > 0 && amortizedPrincipal > 0) {
          currentMinimumPayment = calculateMinimumPayment(amortizedPrincipal, currentRate, remainingMonths);
        }
        
        transactions.push({
          date: event.date,
          type: 'Rate Change',
          description: `Rate changed to ${currentRate}%, new minimum: ${currentMinimumPayment.toFixed(2)}`,
          amount: 0,
          amortizedPrincipal: amortizedPrincipal,
          redrawOffsetPool: redrawOffsetPool,
          netInterestBearingBalance: amortizedPrincipal - redrawOffsetPool,
          rate: currentRate,
          minimumPayment: currentMinimumPayment
        });
        break;
        
      // Handle other user timeline events
      case 'recast':
        const recastAmount = event.value;
        amortizedPrincipal = Math.max(0, amortizedPrincipal - recastAmount);
        
        // Recalculate minimum payment with remaining term
        const recastRemainingMonths = totalTermMonths - Math.ceil((eventDate - startDateObj) / (1000 * 60 * 60 * 24 * 30));
        if (recastRemainingMonths > 0 && amortizedPrincipal > 0) {
          currentMinimumPayment = calculateMinimumPayment(amortizedPrincipal, currentRate, recastRemainingMonths);
        }
        
        transactions.push({
          date: event.date,
          type: 'Recast',
          description: `Lump sum payment of ${recastAmount.toFixed(2)} applied to principal, new minimum: ${currentMinimumPayment.toFixed(2)}`,
          amount: -recastAmount,
          amortizedPrincipal: amortizedPrincipal,
          redrawOffsetPool: redrawOffsetPool,
          netInterestBearingBalance: amortizedPrincipal - redrawOffsetPool,
          rate: currentRate,
          minimumPayment: currentMinimumPayment
        });
        break;
        
      case 'refinance':
        amortizedPrincipal = event.value;
        // Recalculate minimum payment for refinanced loan
        const refinanceRemainingMonths = totalTermMonths - Math.ceil((eventDate - startDateObj) / (1000 * 60 * 60 * 24 * 30));
        if (refinanceRemainingMonths > 0 && amortizedPrincipal > 0) {
          currentMinimumPayment = calculateMinimumPayment(amortizedPrincipal, currentRate, refinanceRemainingMonths);
        }
        
        transactions.push({
          date: event.date,
          type: 'Refinance',
          description: `Loan refinanced to new balance of ${event.value.toFixed(2)}, new minimum: ${currentMinimumPayment.toFixed(2)}`,
          amount: 0,
          amortizedPrincipal: amortizedPrincipal,
          redrawOffsetPool: redrawOffsetPool,
          netInterestBearingBalance: amortizedPrincipal - redrawOffsetPool,
          rate: currentRate,
          minimumPayment: currentMinimumPayment
        });
        break;
        
      case 'adjustBalance':
        amortizedPrincipal = event.value;
        transactions.push({
          date: event.date,
          type: 'Balance Adjustment',
          description: `Loan balance manually adjusted to ${event.value.toFixed(2)}`,
          amount: 0,
          amortizedPrincipal: amortizedPrincipal,
          redrawOffsetPool: redrawOffsetPool,
          netInterestBearingBalance: amortizedPrincipal - redrawOffsetPool,
          rate: currentRate,
          minimumPayment: currentMinimumPayment
        });
        break;
        
      case 'adjustOffset':
        redrawOffsetPool = event.value;
        transactions.push({
          date: event.date,
          type: 'Offset Adjustment',
          description: `Offset/redraw balance manually adjusted to ${event.value.toFixed(2)}`,
          amount: 0,
          amortizedPrincipal: amortizedPrincipal,
          redrawOffsetPool: redrawOffsetPool,
          netInterestBearingBalance: amortizedPrincipal - redrawOffsetPool,
          rate: currentRate,
          minimumPayment: currentMinimumPayment
        });
        break;
    }
    
    // Check for effective payoff (when net interest-bearing balance hits zero or goes negative)
    const netBalance = amortizedPrincipal - redrawOffsetPool;
    if (netBalance <= 0.01 && !effectivePayoffDate) {
      effectivePayoffDate = event.date;
      break;
    }
  }
  
  // Calculate interest saved
  const originalTotalInterest = (originalMinimumPayment * totalTermMonths) - principal;
  const interestSaved = Math.max(0, originalTotalInterest - totalInterestPaid);
  
  // Create summary schedule for charts
  const schedule = [];
  const paymentTransactions = transactions.filter(t => 
    t.type === 'Monthly Payment' || t.type === 'Initial Loan'
  );
  
  paymentTransactions.forEach((transaction, index) => {
    schedule.push({
      month: index,
      date: transaction.date,
      payment: transaction.type === 'Monthly Payment' ? Math.abs(transaction.amount) : 0,
      balance: transaction.amortizedPrincipal,
      offsetBalance: transaction.redrawOffsetPool,
      effectiveBalance: transaction.netInterestBearingBalance,
      cumulativeInterest: totalInterestPaid,
      rate: transaction.rate
    });
  });
  
  return {
    monthlyPayment: originalMinimumPayment,
    totalInterest: totalInterestPaid,
    totalPayments: totalPaymentsMade,
    actualTermMonths: schedule.length,
    payoffDate: effectivePayoffDate || 'Not calculated',
    interestSaved,
    schedule,
    transactions,
    originalTotalInterest
  };
}