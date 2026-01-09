export function calculateMortgage(mortgageData, timelineEvents) {
  const { principal, interestRate, termYears, termMonths, startDate, offsetBalance, paymentDay, interestDay, isExistingMortgage } = mortgageData;
  
  console.log('Starting mortgage calculation with:', { principal, interestRate, paymentDay, interestDay, startDate, isExistingMortgage });
  
  // Calculate total term in months
  const totalTermMonths = (termYears * 12) + (termMonths || 0);
  
  // Function to calculate monthly payment using daily compounding
  const calculateMonthlyPayment = (loanAmount, annualRate, termInMonths) => {
    if (annualRate === 0) return loanAmount / termInMonths;
    
    // Convert annual rate to daily rate
    const dailyRate = (annualRate / 100) / 365;
    
    // Calculate effective monthly rate from daily compounding
    // Effective monthly rate = (1 + daily rate)^(365/12) - 1
    const effectiveMonthlyRate = Math.pow(1 + dailyRate, 365/12) - 1;
    
    // Standard amortization formula with effective monthly rate
    const monthlyPayment = loanAmount * 
      (effectiveMonthlyRate * Math.pow(1 + effectiveMonthlyRate, termInMonths)) /
      (Math.pow(1 + effectiveMonthlyRate, termInMonths) - 1);
    
    return monthlyPayment;
  };
  
  // Calculate original mortgage for comparison using daily compounding
  const originalMonthlyPayment = calculateMonthlyPayment(principal, interestRate, totalTermMonths);
  const originalTotalInterest = (originalMonthlyPayment * totalTermMonths) - principal;
  
  console.log(`Payment calculation for ${principal}: ${originalMonthlyPayment.toFixed(2)} (should be ~$4022 for 706167)`);

  // Initialize the transaction ledger
  const transactions = [];
  let runningBalance = principal;
  let runningOffsetBalance = offsetBalance || 0;
  let currentRate = interestRate;
  let currentMonthlyPayment = originalMonthlyPayment;
  let currentMinimumPayment = originalMonthlyPayment; // Fixed minimum payment
  let totalInterestPaid = 0;
  let totalPaymentsMade = 0;
  let effectivePayoffDate = null; // Track when effective balance hits zero

  console.log(`Loan setup: ${principal} at ${interestRate}% for ${totalTermMonths} months`);
  console.log(`Monthly payment: ${originalMonthlyPayment.toFixed(2)}`);
  console.log(`Minimum payment: ${currentMinimumPayment.toFixed(2)}`);
  console.log(`Payment day: ${paymentDay}, Interest day: ${interestDay}`);

  // Create the initial loan transaction
  transactions.push({
    date: startDate,
    type: 'Initial Loan',
    description: 'Mortgage loan originated',
    amount: 0,
    mortgageBalance: runningBalance,
    offsetBalance: runningOffsetBalance,
    effectiveBalance: Math.max(0, runningBalance - runningOffsetBalance),
    rate: currentRate,
    monthlyPayment: currentMonthlyPayment,
    minimumPayment: undefined
  });

  // Sort timeline events by date to ensure chronological processing
  const sortedEvents = [...timelineEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
  let processedEventIds = new Set();
  
  // Generate monthly transactions for the entire loan term
  const startDateObj = new Date(startDate);
  
  for (let month = 1; month <= totalTermMonths && runningBalance > 0.01; month++) {
    // Calculate the date for this month's transactions
    const monthDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + month, 1);
    const monthStart = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + month - 1, 1);
    const monthEnd = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + month, 0);
    
    // Process any timeline events that occur during this month and haven't been processed yet
    const monthEvents = sortedEvents.filter(event => {
      const eventDate = new Date(event.date);
      const eventId = `${event.type}-${event.date}-${event.value}`;
      
      return eventDate >= monthStart && 
             eventDate <= monthEnd && 
             !processedEventIds.has(eventId);
    });
    
    console.log(`Month ${month}: Processing events from ${monthStart.toDateString()} to ${monthEnd.toDateString()}, found ${monthEvents.length} timeline events`);
    
    // Apply timeline events
    for (const event of monthEvents) {
      const eventDateStr = event.date;
      const eventId = `${event.type}-${event.date}-${event.value}`;
      processedEventIds.add(eventId);
      
      console.log(`Processing timeline event: ${event.type} = ${event.value} on ${eventDateStr}`);
      
      switch (event.type) {
        case 'deposit':
          runningOffsetBalance += event.value;
          transactions.push({
            date: eventDateStr,
            type: 'Deposit',
            description: `Deposit to offset/redraw account`,
            amount: -event.value,
            mortgageBalance: runningBalance,
            offsetBalance: runningOffsetBalance,
            effectiveBalance: Math.max(0, runningBalance - runningOffsetBalance),
            rate: currentRate,
            monthlyPayment: currentMonthlyPayment,
            minimumPayment: undefined
          });
          break;
          
        case 'redraw':
          if (runningOffsetBalance >= event.value) {
            runningOffsetBalance -= event.value;
          } else {
            const fromLoan = event.value - runningOffsetBalance;
            runningOffsetBalance = 0;
            runningBalance += fromLoan;
          }
          transactions.push({
            date: eventDateStr,
            type: 'Redraw',
            description: `Redraw from offset/loan`,
            amount: event.value,
            mortgageBalance: runningBalance,
            offsetBalance: runningOffsetBalance,
            effectiveBalance: Math.max(0, runningBalance - runningOffsetBalance),
            rate: currentRate,
            monthlyPayment: currentMonthlyPayment,
            minimumPayment: undefined
          });
          break;
          
        case 'rateChange':
          currentRate = event.value;
          const remainingMonths = totalTermMonths - month + 1;
          const newRate = (currentRate / 100) / 12;
          if (newRate > 0 && runningBalance > 0) {
            // Recalculate both monthly payment and minimum payment when rate changes
            currentMonthlyPayment = calculateMonthlyPayment(runningBalance, currentRate, remainingMonths);
            currentMinimumPayment = currentMonthlyPayment; // Update minimum payment
          }
          transactions.push({
            date: eventDateStr,
            type: 'Rate Change',
            description: `Interest rate changed to ${currentRate}%, new minimum payment: ${currentMinimumPayment.toFixed(2)}`,
            amount: 0,
            mortgageBalance: runningBalance,
            offsetBalance: runningOffsetBalance,
            effectiveBalance: Math.max(0, runningBalance - runningOffsetBalance),
            rate: currentRate,
            monthlyPayment: currentMonthlyPayment,
            minimumPayment: undefined
          });
          break;
          
        case 'repaymentChange':
          const oldPayment = currentMonthlyPayment;
          currentMonthlyPayment = event.value;
          console.log(`REPAYMENT CHANGE: Old payment: ${oldPayment.toFixed(2)}, New payment: ${currentMonthlyPayment.toFixed(2)}`);
          transactions.push({
            date: eventDateStr,
            type: 'Payment Change',
            description: `Monthly payment changed from ${oldPayment.toFixed(2)} to ${currentMonthlyPayment.toFixed(2)}, minimum payment remains ${currentMinimumPayment.toFixed(2)}`,
            amount: 0,
            mortgageBalance: runningBalance,
            offsetBalance: runningOffsetBalance,
            effectiveBalance: Math.max(0, runningBalance - runningOffsetBalance),
            rate: currentRate,
            monthlyPayment: currentMonthlyPayment,
            minimumPayment: undefined
          });
          break;
          
        case 'recast':
          const recastAmount = event.value;
          runningBalance = Math.max(0, runningBalance - recastAmount);
          
          // Recalculate monthly payment and minimum payment with remaining term
          const recastRemainingMonths = totalTermMonths - month + 1;
          if (runningBalance > 0) {
            currentMonthlyPayment = calculateMonthlyPayment(runningBalance, currentRate, recastRemainingMonths);
            currentMinimumPayment = currentMonthlyPayment; // Update minimum payment after recast
          }
          
          transactions.push({
            date: eventDateStr,
            type: 'Recast',
            description: `Lump sum payment of ${recastAmount.toFixed(2)} applied to principal, new minimum payment: ${currentMinimumPayment.toFixed(2)}`,
            amount: -recastAmount,
            mortgageBalance: runningBalance,
            offsetBalance: runningOffsetBalance,
            effectiveBalance: Math.max(0, runningBalance - runningOffsetBalance),
            rate: currentRate,
            monthlyPayment: currentMonthlyPayment,
            minimumPayment: undefined
          });
          break;
          
        case 'refinance':
          runningBalance = event.value;
          // Recalculate minimum payment for refinanced loan
          const refinanceRemainingMonths = totalTermMonths - month + 1;
          if (runningBalance > 0) {
            currentMonthlyPayment = calculateMonthlyPayment(runningBalance, currentRate, refinanceRemainingMonths);
            currentMinimumPayment = currentMonthlyPayment; // Update minimum payment after refinance
          }
          transactions.push({
            date: eventDateStr,
            type: 'Refinance',
            description: `Loan refinanced to new balance of ${event.value.toFixed(2)}, new minimum payment: ${currentMinimumPayment.toFixed(2)}`,
            amount: 0,
            mortgageBalance: runningBalance,
            offsetBalance: runningOffsetBalance,
            effectiveBalance: Math.max(0, runningBalance - runningOffsetBalance),
            rate: currentRate,
            monthlyPayment: currentMonthlyPayment,
            minimumPayment: undefined
          });
          break;
          
        case 'adjustBalance':
          runningBalance = event.value;
          transactions.push({
            date: eventDateStr,
            type: 'Balance Adjustment',
            description: `Loan balance manually adjusted to ${event.value.toFixed(2)}`,
            amount: 0,
            mortgageBalance: runningBalance,
            offsetBalance: runningOffsetBalance,
            effectiveBalance: Math.max(0, runningBalance - runningOffsetBalance),
            rate: currentRate,
            monthlyPayment: currentMonthlyPayment,
            minimumPayment: undefined
          });
          break;
          
        case 'adjustOffset':
          runningOffsetBalance = event.value;
          transactions.push({
            date: eventDateStr,
            type: 'Offset Adjustment',
            description: `Offset/redraw balance manually adjusted to ${event.value.toFixed(2)}`,
            amount: 0,
            mortgageBalance: runningBalance,
            offsetBalance: runningOffsetBalance,
            effectiveBalance: Math.max(0, runningBalance - runningOffsetBalance),
            rate: currentRate,
            monthlyPayment: currentMonthlyPayment,
            minimumPayment: undefined
          });
          break;
      }
    }
    
    // Calculate interest charge (on interest day) - daily compounding with rate change support
    const interestDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + month, interestDay || 1);
    const interestDateStr = `${interestDate.getFullYear()}-${String(interestDate.getMonth() + 1).padStart(2, '0')}-${String(interestDay || 1).padStart(2, '0')}`;
    
    // Calculate the previous interest date
    let prevInterestDate;
    
    if (month === 1) {
      if (isExistingMortgage) {
        // For existing mortgages, calculate from the previous interest date
        // The previous interest date should be one month before the FIRST interest payment date
        const firstInterestYear = interestDate.getFullYear();
        const firstInterestMonth = interestDate.getMonth();
        
        // Previous interest was one month before the first interest payment
        prevInterestDate = new Date(firstInterestYear, firstInterestMonth - 1, interestDay);
        
        console.log(`Existing mortgage debug:`);
        console.log(`  Start date: ${startDateObj.toDateString()}`);
        console.log(`  First interest date: ${interestDate.toDateString()}`);
        console.log(`  Previous interest date set to ${prevInterestDate.toDateString()}`);
      } else {
        // For new mortgages, use the actual mortgage start date
        prevInterestDate = startDateObj;
      }
    } else {
      prevInterestDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + month - 1, interestDay || 1);
    }
    
    const effectiveBalance = Math.max(0, runningBalance - runningOffsetBalance);
    
    // Calculate interest if there's an effective balance and either:
    // - It's an existing mortgage (always calculate for first month)
    // - It's a new mortgage and the interest date is after the start date
    const shouldCalculateInterest = effectiveBalance > 0.01 && 
      (isExistingMortgage || interestDate > startDateObj);
    
    console.log(`Month ${month}: Should calculate interest? ${shouldCalculateInterest} (existing: ${isExistingMortgage}, effectiveBalance: ${effectiveBalance.toFixed(2)}, interestDate: ${interestDate.toDateString()}, startDate: ${startDateObj.toDateString()})`);
    
    if (shouldCalculateInterest) {
      // Calculate the actual start date for interest calculation
      let interestStartDate = prevInterestDate;
      
      if (isExistingMortgage && month === 1) {
        // For existing mortgages, start from the day AFTER the previous interest payment
        interestStartDate = new Date(prevInterestDate);
        interestStartDate.setDate(interestStartDate.getDate() + 1);
      }
      
      // Calculate days from the start date to the interest date (exclusive of start, inclusive of end)
      const daysDiff = Math.ceil((interestDate - interestStartDate) / (1000 * 60 * 60 * 24));
      
      console.log(`Month ${month}: Interest calculation (${isExistingMortgage ? 'existing' : 'new'} mortgage) - Start: ${interestStartDate.toDateString()}, End: ${interestDate.toDateString()}, Days: ${daysDiff}`);
      
      // Check if there were any rate changes in this period
      const rateChangesInPeriod = sortedEvents.filter(event => {
        if (event.type !== 'rateChange') return false;
        const eventDate = new Date(event.date);
        return eventDate > interestStartDate && eventDate <= interestDate;
      });
      
      let totalInterestCharge;
      let interestDescription;
      
      if (rateChangesInPeriod.length === 0) {
        // No rate changes, simple daily calculation
        const dailyRate = (currentRate / 100) / 365;
        totalInterestCharge = effectiveBalance * dailyRate * daysDiff;
        const startDateStr = interestStartDate.toLocaleDateString();
        const endDateStr = interestDate.toLocaleDateString();
        interestDescription = `Interest for ${daysDiff} days (${startDateStr} to ${endDateStr}) at ${currentRate}% on ${effectiveBalance.toFixed(2)}`;
      } else {
        // Rate changes occurred, calculate proportionally
        // For simplicity, we'll use the current rate but note the changes
        const dailyRate = (currentRate / 100) / 365;
        totalInterestCharge = effectiveBalance * dailyRate * daysDiff;
        const startDateStr = interestStartDate.toLocaleDateString();
        const endDateStr = interestDate.toLocaleDateString();
        interestDescription = `Interest for ${daysDiff} days (${startDateStr} to ${endDateStr}, rate changes occurred) at avg ${currentRate}% on ${effectiveBalance.toFixed(2)}`;
      }
      
      runningBalance += totalInterestCharge;
      totalInterestPaid += totalInterestCharge;
      
      transactions.push({
        date: interestDateStr,
        type: 'Interest Charge',
        description: interestDescription,
        amount: totalInterestCharge,
        mortgageBalance: runningBalance,
        offsetBalance: runningOffsetBalance,
        effectiveBalance: Math.max(0, runningBalance - runningOffsetBalance),
        rate: currentRate,
        monthlyPayment: currentMonthlyPayment,
        minimumPayment: undefined
      });
      
      console.log(`Month ${month}: Interest ${totalInterestCharge.toFixed(2)} charged on ${interestDateStr}, balance now ${runningBalance.toFixed(2)}`);
    } else {
      console.log(`Month ${month}: No interest calculated - Interest date: ${interestDate.toDateString()}, Start date: ${startDateObj.toDateString()}, Effective balance: ${effectiveBalance.toFixed(2)}`);
    }
    
    // Process monthly payment (on payment day)
    const paymentDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + month, paymentDay || 1);
    // Fix timezone issues by ensuring we get the correct date
    const paymentDateStr = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}-${String(paymentDay || 1).padStart(2, '0')}`;
    
    if (runningBalance > 0.01) {
      const newEffectiveBalance = Math.max(0, runningBalance - runningOffsetBalance);
      
      if (newEffectiveBalance > 0.01) {
        // Use the fixed minimum payment (only changes on rate changes or refinancing)
        const minimumPayment = currentMinimumPayment;
        
        // Split the payment: minimum goes to principal, excess goes to offset
        const principalPayment = Math.min(minimumPayment, runningBalance);
        const excessPayment = Math.max(0, currentMonthlyPayment - minimumPayment);
        
        // Apply payments
        runningBalance -= principalPayment;
        runningOffsetBalance += excessPayment;
        totalPaymentsMade += currentMonthlyPayment;
        
        transactions.push({
          date: paymentDateStr,
          type: 'Monthly Payment',
          description: `Payment: ${principalPayment.toFixed(2)} principal + ${excessPayment.toFixed(2)} to offset (min: ${minimumPayment.toFixed(2)})`,
          amount: -currentMonthlyPayment,
          mortgageBalance: runningBalance,
          offsetBalance: runningOffsetBalance,
          effectiveBalance: Math.max(0, runningBalance - runningOffsetBalance),
          rate: currentRate,
          monthlyPayment: currentMonthlyPayment,
          minimumPayment: minimumPayment
        });
        
        console.log(`Month ${month}: Payment ${currentMonthlyPayment.toFixed(2)} (min: ${minimumPayment.toFixed(2)}, principal: ${principalPayment.toFixed(2)}, offset: ${excessPayment.toFixed(2)}) on ${paymentDateStr}, balance now ${runningBalance.toFixed(2)}`);
      } else {
        // All payment goes to offset since effective balance is covered
        runningOffsetBalance += currentMonthlyPayment;
        totalPaymentsMade += currentMonthlyPayment;
        
        transactions.push({
          date: paymentDateStr,
          type: 'Payment to Offset',
          description: `Full payment to offset - loan covered by existing offset`,
          amount: -currentMonthlyPayment,
          mortgageBalance: runningBalance,
          offsetBalance: runningOffsetBalance,
          effectiveBalance: 0,
          rate: currentRate,
          monthlyPayment: currentMonthlyPayment,
          minimumPayment: 0
        });
      }
    }
    
    // Check if effective balance has hit zero after all transactions for this month
    const finalEffectiveBalance = Math.max(0, runningBalance - runningOffsetBalance);
    if (finalEffectiveBalance <= 0.01 && !effectivePayoffDate) {
      effectivePayoffDate = paymentDateStr;
      console.log(`Effective balance paid off in month ${month} on ${effectivePayoffDate}`);
      // Stop processing once effective balance is zero - mortgage is effectively paid off
      break;
    }
    
    // Stop if loan is paid off
    if (runningBalance <= 0.01) {
      console.log(`Loan paid off in month ${month}`);
      break;
    }
  }

  // Calculate results - use effective payoff date when available
  const payoffDate = effectivePayoffDate || 
    (runningBalance <= 0.01 ? 
      transactions[transactions.length - 1]?.date || startDate :
      (() => {
        const payoffYear = startDateObj.getFullYear() + termYears;
        const payoffMonth = startDateObj.getMonth();
        return `${payoffYear}-${String(payoffMonth + 1).padStart(2, '0')}-${String(paymentDay || 1).padStart(2, '0')}`;
      })());
  
  // Calculate interest saved - always show the difference between original and actual interest
  const interestSaved = Math.max(0, originalTotalInterest - totalInterestPaid);

  // Create summary schedule for chart
  const schedule = [];
  const paymentTransactions = transactions.filter(t => 
    t.type === 'Monthly Payment' || 
    t.type === 'No Payment Required' || 
    t.type === 'Initial Loan'
  );
  
  paymentTransactions.forEach((transaction, index) => {
    const interestUpToHere = transactions
      .filter(t => t.date <= transaction.date && t.type === 'Interest Charge')
      .reduce((sum, t) => sum + t.amount, 0);
    
    schedule.push({
      month: index,
      date: transaction.date,
      payment: transaction.type === 'Monthly Payment' ? Math.abs(transaction.amount) : 0,
      balance: transaction.mortgageBalance,
      offsetBalance: transaction.offsetBalance,
      effectiveBalance: transaction.effectiveBalance,
      cumulativeInterest: interestUpToHere,
      rate: transaction.rate
    });
  });

  console.log(`Calculation complete:`);
  console.log(`  - Total transactions: ${transactions.length}`);
  console.log(`  - Interest transactions: ${transactions.filter(t => t.type === 'Interest Charge').length}`);
  console.log(`  - Payment transactions: ${transactions.filter(t => t.type === 'Monthly Payment').length}`);
  console.log(`  - Final balance: ${runningBalance.toFixed(2)}`);
  console.log(`  - Total interest paid: ${totalInterestPaid.toFixed(2)}`);
  console.log(`  - Interest saved: ${interestSaved.toFixed(2)}`);
  
  // Sort all transactions by date to ensure chronological order
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return {
    monthlyPayment: originalMonthlyPayment,
    totalInterest: totalInterestPaid,
    totalPayments: totalPaymentsMade,
    actualTermMonths: schedule.length,
    payoffDate,
    interestSaved,
    schedule,
    transactions,
    originalTotalInterest
  };
}