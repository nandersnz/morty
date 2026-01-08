export function calculateMortgage(mortgageData, timelineEvents) {
  const { principal, interestRate, termYears, termMonths, startDate, offsetBalance, paymentDay, interestDay } = mortgageData;
  
  console.log('calculateMortgage called with:', { paymentDay, interestDay, principal, interestRate });
  
  // Calculate total term in months
  const totalTermMonths = (termYears * 12) + (termMonths || 0);
  
  // Calculate original mortgage for comparison
  const originalMonthlyRate = (interestRate / 100) / 12;
  const originalTotalPayments = totalTermMonths;
  const originalMonthlyPayment = principal * 
    (originalMonthlyRate * Math.pow(1 + originalMonthlyRate, originalTotalPayments)) /
    (Math.pow(1 + originalMonthlyRate, originalTotalPayments) - 1);
  
  const originalTotalInterest = (originalMonthlyPayment * originalTotalPayments) - principal;

  // Initialize state
  let currentBalance = principal;
  let currentRate = interestRate;
  let currentOffsetBalance = offsetBalance || 0;
  let monthlyPayment = originalMonthlyPayment;
  let totalInterest = 0;
  let totalPayments = 0;
  
  const transactions = [];
  const sortedEvents = [...timelineEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Add initial transaction
  transactions.push({
    date: startDate,
    type: 'Initial Loan',
    description: 'Mortgage loan originated',
    amount: 0,
    mortgageBalance: currentBalance,
    offsetBalance: currentOffsetBalance,
    effectiveBalance: Math.max(0, currentBalance - currentOffsetBalance),
    rate: currentRate,
    monthlyPayment: monthlyPayment
  });
  
  // Create all transaction dates (payment dates + interest dates + timeline event dates)
  const allDates = new Set();
  
  // Add payment dates and interest dates for the full term plus buffer
  const startDateObj = new Date(startDate);
  for (let month = 1; month <= totalTermMonths + 24; month++) {
    // Add payment dates
    const paymentDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + month, paymentDay || 1);
    allDates.add(paymentDate.toISOString().split('T')[0]);
    
    // Add interest dates (always add them, even if same as payment dates)
    const interestDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + month, interestDay || 1);
    allDates.add(interestDate.toISOString().split('T')[0]);
  }
  
  console.log('Payment day:', paymentDay, 'Interest day:', interestDay);
  console.log('Total significant dates:', allDates.size);
  
  // Add timeline event dates
  sortedEvents.forEach(event => {
    allDates.add(event.date);
  });
  
  // Sort all dates chronologically
  const sortedDates = Array.from(allDates).sort();
  
  console.log(`Processing ${sortedDates.length} dates from ${sortedDates[0]} to ${sortedDates[sortedDates.length-1]}`);
  console.log(`First 10 dates:`, sortedDates.slice(0, 10));
  
  // Process each date
  for (const dateStr of sortedDates) {
    if (currentBalance <= 0.01 && currentOffsetBalance >= 0) break;
    
    const currentDateObj = new Date(dateStr);
    const isPaymentDate = currentDateObj.getDate() === (paymentDay || 1);
    const isInterestDate = currentDateObj.getDate() === (interestDay || 1);
    
    console.log(`Processing date ${dateStr}: isPaymentDate=${isPaymentDate}, isInterestDate=${isInterestDate}`);
    
    // Process timeline events first
    const dateEvents = sortedEvents.filter(event => event.date === dateStr);
    
    for (const event of dateEvents) {
      let transactionAmount = event.value;
      let description = '';
      
      switch (event.type) {
        case 'rateChange':
          const oldRate = currentRate;
          currentRate = event.value;
          
          // Recalculate monthly payment with new rate
          const newMonthlyRate = (currentRate / 100) / 12;
          const remainingMonths = Math.max(1, totalTermMonths - Math.floor((currentDateObj - startDateObj) / (30.44 * 24 * 60 * 60 * 1000)));
          
          if (newMonthlyRate > 0 && currentBalance > 0) {
            monthlyPayment = currentBalance * 
              (newMonthlyRate * Math.pow(1 + newMonthlyRate, remainingMonths)) /
              (Math.pow(1 + newMonthlyRate, remainingMonths) - 1);
          }
          
          description = `Interest rate changed from ${oldRate}% to ${currentRate}%`;
          transactionAmount = 0;
          break;
          
        case 'deposit':
          currentOffsetBalance += event.value;
          description = `Deposit to offset account`;
          transactionAmount = -event.value; // Negative because it reduces effective balance
          break;
          
        case 'redraw':
          if (currentOffsetBalance >= event.value) {
            currentOffsetBalance -= event.value;
            description = `Redraw from offset account`;
          } else {
            const fromOffset = currentOffsetBalance;
            const fromLoan = event.value - currentOffsetBalance;
            currentOffsetBalance = 0;
            currentBalance += fromLoan;
            description = `Redraw: $${fromOffset.toFixed(2)} from offset, $${fromLoan.toFixed(2)} increases loan`;
          }
          break;
          
        case 'repaymentChange':
          const oldPayment = monthlyPayment;
          monthlyPayment = event.value;
          description = `Monthly payment changed from ${oldPayment.toFixed(2)} to ${monthlyPayment.toFixed(2)}`;
          transactionAmount = 0;
          break;
          
        case 'refinance':
          currentBalance = event.value;
          description = `Loan refinanced to new balance`;
          transactionAmount = 0;
          break;
          
        case 'recast':
          currentBalance = Math.max(0, currentBalance - event.value);
          description = `Recast: lump sum payment applied to principal`;
          
          // Recalculate monthly payment
          const recastRate = (currentRate / 100) / 12;
          const recastRemainingMonths = Math.max(1, totalTermMonths - Math.floor((currentDateObj - startDateObj) / (30.44 * 24 * 60 * 60 * 1000)));
          
          if (recastRate > 0 && currentBalance > 0) {
            monthlyPayment = currentBalance * 
              (recastRate * Math.pow(1 + recastRate, recastRemainingMonths)) /
              (Math.pow(1 + recastRate, recastRemainingMonths) - 1);
          }
          break;
          
        case 'adjustBalance':
          currentBalance = event.value;
          description = `Loan balance manually adjusted`;
          transactionAmount = 0;
          break;
          
        case 'adjustOffset':
          currentOffsetBalance = event.value;
          description = `Offset balance manually adjusted`;
          transactionAmount = 0;
          break;
      }
      
      // Add transaction for this event
      transactions.push({
        date: dateStr,
        type: event.type,
        description: description,
        amount: transactionAmount,
        mortgageBalance: Math.max(0, currentBalance),
        offsetBalance: currentOffsetBalance,
        effectiveBalance: Math.max(0, currentBalance - currentOffsetBalance),
        rate: currentRate,
        monthlyPayment: monthlyPayment
      });
    }
    
    // Process interest charge if this is an interest date
    if (isInterestDate && currentBalance > 0.01) {
      console.log(`Processing interest on ${dateStr}, balance: ${currentBalance}, offset: ${currentOffsetBalance}`);
      const effectiveBalance = Math.max(0, currentBalance - currentOffsetBalance);
      console.log(`Effective balance for interest: ${effectiveBalance}`);
      
      if (effectiveBalance > 0.01) {
        // Calculate interest charge
        const monthlyRate = (currentRate / 100) / 12;
        const interestCharge = effectiveBalance * monthlyRate;
        console.log(`Interest charge calculated: ${interestCharge} (rate: ${monthlyRate})`);
        
        // Add interest to the mortgage balance
        currentBalance += interestCharge;
        
        // Add interest charge transaction
        transactions.push({
          date: dateStr,
          type: 'Interest Charge',
          description: `Monthly interest charge at ${currentRate}% on effective balance of ${effectiveBalance.toFixed(2)}`,
          amount: interestCharge,
          mortgageBalance: currentBalance,
          offsetBalance: currentOffsetBalance,
          effectiveBalance: Math.max(0, currentBalance - currentOffsetBalance),
          rate: currentRate,
          monthlyPayment: monthlyPayment
        });
        
        totalInterest += interestCharge;
        
        console.log(`Interest charged: $${interestCharge.toFixed(2)} on ${dateStr}, new balance: $${currentBalance.toFixed(2)}`);
      } else {
        console.log(`No interest charged on ${dateStr} - effective balance is ${effectiveBalance}`);
      }
    }
    
    // Process monthly payment if this is a payment date
    if (isPaymentDate && currentBalance > 0.01) {
      const effectiveBalance = Math.max(0, currentBalance - currentOffsetBalance);
      
      if (effectiveBalance > 0.01) {
        // Calculate principal payment (full payment amount goes to principal since interest was already charged)
        const principalPayment = Math.min(monthlyPayment, currentBalance);
        const actualPayment = monthlyPayment;
        
        // Apply payment
        currentBalance -= principalPayment;
        totalPayments += actualPayment;
        
        // Add payment transaction
        transactions.push({
          date: dateStr,
          type: 'Monthly Payment',
          description: `Monthly payment: $${principalPayment.toFixed(2)} principal (interest charged separately on interest day)`,
          amount: -actualPayment, // Negative because it's money going out
          mortgageBalance: Math.max(0, currentBalance),
          offsetBalance: currentOffsetBalance,
          effectiveBalance: Math.max(0, currentBalance - currentOffsetBalance),
          rate: currentRate,
          monthlyPayment: monthlyPayment
        });
        
        console.log(`Payment processed: $${actualPayment.toFixed(2)} on ${dateStr}, new balance: $${currentBalance.toFixed(2)}`);
      } else {
        // Loan is effectively paid off due to offset
        transactions.push({
          date: dateStr,
          type: 'No Payment Required',
          description: 'No payment required - offset balance covers loan',
          amount: 0,
          mortgageBalance: currentBalance,
          offsetBalance: currentOffsetBalance,
          effectiveBalance: 0,
          rate: currentRate,
          monthlyPayment: monthlyPayment
        });
      }
    }
  }
  
  // Find payoff date
  const lastTransaction = transactions[transactions.length - 1];
  const payoffDate = lastTransaction?.effectiveBalance <= 0.01 ? 
    lastTransaction.date : 
    new Date(startDateObj.getFullYear() + termYears, startDateObj.getMonth(), paymentDay || 1).toISOString().split('T')[0];
  
  const interestSaved = Math.max(0, originalTotalInterest - totalInterest);
  
  // Create summary schedule for chart (monthly snapshots)
  const schedule = [];
  const monthlySnapshots = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getDate() === (paymentDay || 1) || 
           tDate.getDate() === (interestDay || 1) || 
           t.type === 'Initial Loan';
  });
  
  let cumulativeInterest = 0;
  monthlySnapshots.forEach((transaction, index) => {
    if (transaction.interestCharge) {
      cumulativeInterest += transaction.interestCharge;
    }
    
    schedule.push({
      month: index,
      date: transaction.date,
      payment: transaction.type === 'Monthly Payment' ? transaction.amount : 0,
      balance: transaction.mortgageBalance,
      offsetBalance: transaction.offsetBalance,
      effectiveBalance: transaction.effectiveBalance,
      cumulativeInterest: cumulativeInterest,
      rate: transaction.rate
    });
  });
  
  return {
    monthlyPayment: originalMonthlyPayment,
    totalInterest,
    totalPayments,
    actualTermMonths: schedule.length,
    payoffDate,
    interestSaved,
    schedule,
    transactions, // New detailed transaction list
    originalTotalInterest
  };
}