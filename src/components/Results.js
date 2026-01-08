import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Results({ results, originalMortgage }) {
  if (!results) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="card">
      <h2>Analysis Results</h2>
      
      <div style={{ marginTop: '32px', marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', color: '#1e293b', fontWeight: '600' }}>Balance Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={results.schedule.filter((_, index) => index % 3 === 0)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).getFullYear()}
            />
            <YAxis 
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value, name) => [formatCurrency(value), name]}
              labelFormatter={(date) => formatDate(date)}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#8884d8" 
              name="Remaining Balance"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="cumulativeInterest" 
              stroke="#82ca9d" 
              name="Cumulative Interest"
              strokeWidth={2}
            />
            {results.schedule[0]?.offsetBalance > 0 && (
              <Line 
                type="monotone" 
                dataKey="effectiveBalance" 
                stroke="#ff7300" 
                name="Effective Balance (after offset)"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 style={{ marginBottom: '16px', color: '#1e293b', fontWeight: '600' }}>Transaction History</h3>
        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction</th>
                <th>Amount</th>
                <th>Mortgage Balance</th>
                <th>Offset Balance</th>
                <th>Effective Balance</th>
              </tr>
            </thead>
            <tbody>
              {results.transactions && results.transactions.map((transaction, index) => (
                <tr key={index} style={{ 
                  backgroundColor: transaction.type === 'Interest Charge' ? '#fef3c7' : 
                                  transaction.type === 'Monthly Payment' ? '#f0f9ff' :
                                  transaction.type === 'deposit' ? '#f0fdf4' :
                                  transaction.type === 'redraw' ? '#fef2f2' :
                                  'transparent'
                }}>
                  <td>{formatDate(transaction.date)}</td>
                  <td>
                    <div style={{ fontWeight: '500' }}>
                      {transaction.type === 'rateChange' ? 'Rate Change' :
                       transaction.type === 'deposit' ? 'Deposit' :
                       transaction.type === 'redraw' ? 'Redraw' :
                       transaction.type === 'repaymentChange' ? 'Payment Change' :
                       transaction.type === 'refinance' ? 'Refinance' :
                       transaction.type === 'recast' ? 'Recast' :
                       transaction.type === 'adjustBalance' ? 'Balance Adjustment' :
                       transaction.type === 'adjustOffset' ? 'Offset Adjustment' :
                       transaction.type}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      {transaction.description}
                    </div>
                  </td>
                  <td style={{ 
                    color: transaction.amount > 0 ? '#dc2626' : 
                           transaction.amount < 0 ? '#16a34a' : 'inherit',
                    fontWeight: transaction.amount !== 0 ? '500' : 'normal'
                  }}>
                    {transaction.amount !== 0 ? formatCurrency(Math.abs(transaction.amount)) : '-'}
                    {transaction.amount > 0 && <span style={{ fontSize: '12px', marginLeft: '4px', color: '#dc2626' }}>+</span>}
                    {transaction.amount < 0 && <span style={{ fontSize: '12px', marginLeft: '4px', color: '#16a34a' }}>-</span>}
                  </td>
                  <td>{formatCurrency(transaction.mortgageBalance)}</td>
                  <td style={{ color: transaction.offsetBalance > 0 ? '#16a34a' : 'inherit' }}>
                    {formatCurrency(transaction.offsetBalance)}
                  </td>
                  <td style={{ 
                    fontWeight: '500',
                    color: transaction.effectiveBalance === 0 ? '#16a34a' : 'inherit'
                  }}>
                    {formatCurrency(transaction.effectiveBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {results.transactions && results.transactions.length > 20 && (
          <div style={{ marginTop: '12px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
            Showing {results.transactions.length} transactions. Scroll to see all entries.
          </div>
        )}
      </div>
    </div>
  );
}

export default Results;