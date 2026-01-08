import { useState } from 'react';
import { calculateInvestmentVsMortgage } from '../utils/investmentCalculator';

function InvestmentManager({ investments, setInvestments, mortgageData, results }) {
  const [showModal, setShowModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [showValueUpdateModal, setShowValueUpdateModal] = useState(false);
  const [selectedInvestmentForUpdate, setSelectedInvestmentForUpdate] = useState(null);
  const [newValueUpdate, setNewValueUpdate] = useState({
    value: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [newInvestment, setNewInvestment] = useState({
    name: '',
    type: 'shares',
    amount: '',
    annualReturn: '',
    dividendYield: '',
    taxRate: '',
    description: '',
    asAtDate: new Date().toISOString().split('T')[0]
  });

  const investmentTypes = {
    shares: 'Shares/Stocks',
    property: 'Property',
    bonds: 'Bonds',
    etf: 'ETF/Index Fund',
    crypto: 'Cryptocurrency',
    savings: 'High Interest Savings',
    term_deposit: 'Term Deposit'
  };

  const addInvestment = () => {
    if (!newInvestment.name || !newInvestment.amount || !newInvestment.annualReturn) return;

    const investment = {
      ...newInvestment,
      id: editingInvestment ? editingInvestment.id : Date.now(),
      amount: parseFloat(newInvestment.amount),
      annualReturn: parseFloat(newInvestment.annualReturn),
      dividendYield: parseFloat(newInvestment.dividendYield) || 0,
      taxRate: parseFloat(newInvestment.taxRate) || 0,
      asAtDate: newInvestment.asAtDate,
      valueUpdates: editingInvestment ? editingInvestment.valueUpdates || [] : []
    };

    if (editingInvestment) {
      // Update existing investment
      setInvestments(prev => prev.map(inv => inv.id === editingInvestment.id ? investment : inv));
    } else {
      // Add new investment
      setInvestments(prev => [...prev, investment]);
    }
    
    setNewInvestment({
      name: '',
      type: 'shares',
      amount: '',
      annualReturn: '',
      dividendYield: '',
      taxRate: '',
      description: '',
      asAtDate: new Date().toISOString().split('T')[0]
    });
    
    setEditingInvestment(null);
    setShowModal(false);
  };

  const editInvestment = (investment) => {
    setNewInvestment({
      name: investment.name,
      type: investment.type,
      amount: investment.amount.toString(),
      annualReturn: investment.annualReturn.toString(),
      dividendYield: investment.dividendYield.toString(),
      taxRate: investment.taxRate.toString(),
      description: investment.description || '',
      asAtDate: investment.asAtDate || new Date().toISOString().split('T')[0]
    });
    setEditingInvestment(investment);
    setShowModal(true);
  };

  const removeInvestment = (id) => {
    setInvestments(prev => prev.filter(investment => investment.id !== id));
  };

  const addValueUpdate = () => {
    if (!newValueUpdate.value || !newValueUpdate.date || !selectedInvestmentForUpdate) return;

    const valueUpdate = {
      value: parseFloat(newValueUpdate.value),
      date: newValueUpdate.date,
      id: Date.now()
    };

    setInvestments(prev => prev.map(investment => {
      if (investment.id === selectedInvestmentForUpdate.id) {
        const updatedValueUpdates = [...(investment.valueUpdates || []), valueUpdate]
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        return { ...investment, valueUpdates: updatedValueUpdates };
      }
      return investment;
    }));

    setNewValueUpdate({
      value: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSelectedInvestmentForUpdate(null);
    setShowValueUpdateModal(false);
  };

  const removeValueUpdate = (investmentId, updateId) => {
    setInvestments(prev => prev.map(investment => {
      if (investment.id === investmentId) {
        return {
          ...investment,
          valueUpdates: (investment.valueUpdates || []).filter(update => update.id !== updateId)
        };
      }
      return investment;
    }));
  };

  const getCurrentInvestmentValue = (investment) => {
    if (!investment.valueUpdates || investment.valueUpdates.length === 0) {
      return investment.amount;
    }
    
    // Get the most recent value update
    const sortedUpdates = [...investment.valueUpdates].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sortedUpdates[0].value;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Investment Analysis</h2>
          <button className="btn" onClick={() => setShowModal(true)}>
            Add Investment
          </button>
        </div>

        <div>
          {investments.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
              No investments added yet. Click "Add Investment" to compare investment returns vs mortgage payments.
            </p>
          ) : (
            <>
              {investments.map(investment => {
                const comparison = results ? calculateInvestmentVsMortgage(investment, mortgageData, results) : null;
                
                return (
                  <div key={investment.id} className="investment-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>{investment.name}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '14px', color: '#64748b' }}>
                          <div><strong>Type:</strong> {investmentTypes[investment.type]}</div>
                          <div><strong>Original Amount:</strong> {formatCurrency(investment.amount)}</div>
                          <div><strong>Current Value:</strong> {formatCurrency(getCurrentInvestmentValue(investment))}</div>
                          <div><strong>As At Date:</strong> {investment.asAtDate ? new Date(investment.asAtDate).toLocaleDateString() : 'Not set'}</div>
                          <div><strong>Annual Return:</strong> {investment.annualReturn}%</div>
                          {investment.dividendYield > 0 && (
                            <div><strong>Dividend Yield:</strong> {investment.dividendYield}%</div>
                          )}
                          {investment.taxRate > 0 && (
                            <div><strong>Tax Rate:</strong> {investment.taxRate}%</div>
                          )}
                        </div>
                        {investment.description && (
                          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                            <strong>Note:</strong> {investment.description}
                          </p>
                        )}

                        {investment.valueUpdates && investment.valueUpdates.length > 0 && (
                          <div style={{ marginTop: '12px', padding: '12px', background: '#f1f5f9', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                                Value Updates ({investment.valueUpdates.length})
                              </h6>
                              <button
                                className="btn"
                                onClick={() => {
                                  setSelectedInvestmentForUpdate(investment);
                                  setShowValueUpdateModal(true);
                                }}
                                style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#10b981', color: 'white' }}
                              >
                                Add Update
                              </button>
                            </div>
                            <div style={{ display: 'grid', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                              {[...investment.valueUpdates].sort((a, b) => new Date(b.date) - new Date(a.date)).map(update => (
                                <div key={update.id} style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center',
                                  fontSize: '13px',
                                  padding: '6px 8px',
                                  background: '#ffffff',
                                  borderRadius: '4px',
                                  border: '1px solid #e2e8f0'
                                }}>
                                  <span>
                                    <strong>{formatCurrency(update.value)}</strong> on {new Date(update.date).toLocaleDateString()}
                                  </span>
                                  <button
                                    onClick={() => removeValueUpdate(investment.id, update.id)}
                                    style={{ 
                                      background: 'none', 
                                      border: 'none', 
                                      color: '#ef4444', 
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      padding: '2px 4px'
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {comparison ? (
                          <div className="comparison-results" style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <h5 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>
                              Investment vs Mortgage Comparison ({results ? Math.round(results.actualTermMonths / 12) : 'N/A'} year timeframe)
                            </h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '14px' }}>
                              <div>
                                <strong>Investment Final Value:</strong><br />
                                <span style={{ color: comparison.investmentBetter ? '#10b981' : '#64748b' }}>
                                  {formatCurrency(comparison.investmentValue)}
                                </span>
                                {investment.type === 'shares' && comparison.dividendValue > 0 && (
                                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                                    <div>Capital Growth: {formatCurrency(comparison.capitalGrowth)}</div>
                                    <div>Dividend Value: {formatCurrency(comparison.dividendValue)}</div>
                                  </div>
                                )}
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                  After {investment.annualReturn}% growth + {investment.dividendYield || 0}% yield - {investment.taxRate || 0}% tax
                                </div>
                              </div>
                              <div>
                                <strong>Mortgage Payment Benefit:</strong><br />
                                <span style={{ color: !comparison.investmentBetter ? '#10b981' : '#64748b' }}>
                                  {formatCurrency(comparison.mortgageSavings)}
                                </span>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                  Principal + interest saved at {mortgageData.interestRate}%
                                </div>
                              </div>
                              <div>
                                <strong>Net Difference:</strong><br />
                                <span style={{ 
                                  color: comparison.netDifference > 0 ? '#10b981' : '#ef4444',
                                  fontWeight: '600'
                                }}>
                                  {comparison.netDifference > 0 ? '+' : ''}{formatCurrency(Math.abs(comparison.netDifference))}
                                </span>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                  {comparison.investmentBetter ? 'Investment advantage' : 'Mortgage advantage'}
                                </div>
                              </div>
                              <div>
                                <strong>Recommendation:</strong><br />
                                <span style={{ 
                                  color: comparison.investmentBetter ? '#10b981' : '#3b82f6',
                                  fontWeight: '600'
                                }}>
                                  {comparison.investmentBetter ? '📈 Invest' : '🏠 Pay Mortgage'}
                                </span>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                  Break-even: {comparison.breakEvenReturn.toFixed(1)}% return needed
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ marginTop: '16px', padding: '16px', background: '#fef3c7', borderRadius: '6px', border: '1px solid #f59e0b' }}>
                            <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
                              ⚠️ Complete your mortgage setup to see investment comparison
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                        <button 
                          className="btn"
                          onClick={() => editInvestment(investment)}
                          style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#3b82f6', color: 'white' }}
                        >
                          Edit
                        </button>
                        {(!investment.valueUpdates || investment.valueUpdates.length === 0) && (
                          <button 
                            className="btn"
                            onClick={() => {
                              setSelectedInvestmentForUpdate(investment);
                              setShowValueUpdateModal(true);
                            }}
                            style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#10b981', color: 'white' }}
                          >
                            Add Update
                          </button>
                        )}
                        <button 
                          className="btn btn-danger" 
                          onClick={() => removeInvestment(investment.id)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingInvestment ? 'Edit Investment' : 'Add Investment'}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  setEditingInvestment(null);
                  setNewInvestment({
                    name: '',
                    type: 'shares',
                    amount: '',
                    annualReturn: '',
                    dividendYield: '',
                    taxRate: '',
                    description: '',
                    asAtDate: new Date().toISOString().split('T')[0]
                  });
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Investment Name</label>
                <input
                  type="text"
                  value={newInvestment.name}
                  onChange={(e) => setNewInvestment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., VDHG ETF, Apple Shares, Investment Property"
                />
              </div>

              <div className="form-group">
                <label>Investment Type</label>
                <select
                  value={newInvestment.type}
                  onChange={(e) => setNewInvestment(prev => ({ ...prev, type: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                >
                  {Object.entries(investmentTypes).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Investment Amount ($)</label>
                <input
                  type="number"
                  value={newInvestment.amount}
                  onChange={(e) => setNewInvestment(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Amount to invest"
                />
              </div>

              <div className="form-group">
                <label>As At Date</label>
                <input
                  type="date"
                  value={newInvestment.asAtDate}
                  onChange={(e) => setNewInvestment(prev => ({ ...prev, asAtDate: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Expected Annual Return (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newInvestment.annualReturn}
                  onChange={(e) => setNewInvestment(prev => ({ ...prev, annualReturn: e.target.value }))}
                  placeholder="e.g., 7.5 for 7.5% annual growth"
                />
              </div>

              <div className="form-group">
                <label>Dividend/Income Yield (% per year, optional)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newInvestment.dividendYield}
                  onChange={(e) => setNewInvestment(prev => ({ ...prev, dividendYield: e.target.value }))}
                  placeholder="e.g., 3.5 for 3.5% dividend yield"
                />
              </div>

              <div className="form-group">
                <label>Tax Rate (% on gains/income, optional)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newInvestment.taxRate}
                  onChange={(e) => setNewInvestment(prev => ({ ...prev, taxRate: e.target.value }))}
                  placeholder="e.g., 30 for 30% tax rate"
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  value={newInvestment.description}
                  onChange={(e) => setNewInvestment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional notes about this investment"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={addInvestment}>
                {editingInvestment ? 'Update Investment' : 'Add Investment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showValueUpdateModal && (
        <div className="modal-overlay" onClick={() => setShowValueUpdateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Investment Value Update</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowValueUpdateModal(false);
                  setSelectedInvestmentForUpdate(null);
                  setNewValueUpdate({
                    value: '',
                    date: new Date().toISOString().split('T')[0]
                  });
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {selectedInvestmentForUpdate && (
                <div style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>{selectedInvestmentForUpdate.name}</h4>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>
                    <div><strong>Original Amount:</strong> {formatCurrency(selectedInvestmentForUpdate.amount)}</div>
                    <div><strong>Current Value:</strong> {formatCurrency(getCurrentInvestmentValue(selectedInvestmentForUpdate))}</div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>New Investment Value ($)</label>
                <input
                  type="number"
                  value={newValueUpdate.value}
                  onChange={(e) => setNewValueUpdate(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Current market value of investment"
                />
              </div>

              <div className="form-group">
                <label>Update Date</label>
                <input
                  type="date"
                  value={newValueUpdate.date}
                  onChange={(e) => setNewValueUpdate(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={addValueUpdate}>
                Add Value Update
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default InvestmentManager;