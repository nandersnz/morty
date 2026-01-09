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
      <h2>Mortgage Analysis</h2>
      
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
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
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
              name="Amortized Principal"
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
                name="Net Interest-Bearing Balance"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Results;