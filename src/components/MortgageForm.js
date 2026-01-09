import React, { useState } from 'react';
import Results from './Results';

function MortgageForm({ mortgageData, setMortgageData, results, investments, timelineEvents, showAnalysis, setShowAnalysis }) {
  const [showModal, setShowModal] = useState(false);

  const handleChange = (field, value) => {
    console.log(`Mortgage field changed: ${field} = ${value}`);
    setMortgageData(prev => {
      const newData = {
        ...prev,
        [field]: value,
        lastModified: Date.now() // Force re-calculation
      };
      console.log('New mortgage data:', newData);
      return newData;
    });
  };

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

  // Calculate current values (as of today)
  const getCurrentValues = () => {
    if (!results || !results.transactions) {
      return {
        mortgageBalance: mortgageData.principal,
        offsetBalance: mortgageData.offsetBalance || 0,
        effectiveBalance: mortgageData.principal - (mortgageData.offsetBalance || 0)
      };
    }
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Find the most recent transaction up to today
    const currentTransaction = results.transactions
      .filter(transaction => transaction.date <= todayStr)
      .pop();
    
    if (currentTransaction) {
      return {
        mortgageBalance: currentTransaction.mortgageBalance || 0,
        offsetBalance: currentTransaction.offsetBalance || 0,
        effectiveBalance: currentTransaction.effectiveBalance || 0
      };
    }
    
    return {
      mortgageBalance: mortgageData.principal,
      offsetBalance: mortgageData.offsetBalance || 0,
      effectiveBalance: mortgageData.principal - (mortgageData.offsetBalance || 0)
    };
  };

  // Calculate total investment value
  const getTotalInvestmentValue = () => {
    if (!investments || investments.length === 0) return 0;
    return investments.reduce((total, investment) => {
      // Use the most recent value update if available, otherwise use original amount
      if (investment.valueUpdates && investment.valueUpdates.length > 0) {
        const sortedUpdates = [...investment.valueUpdates].sort((a, b) => new Date(b.date) - new Date(a.date));
        return total + sortedUpdates[0].value;
      }
      return total + (investment.amount || 0);
    }, 0);
  };

  const currentValues = getCurrentValues();
  const totalInvestmentValue = getTotalInvestmentValue();

  return (
    <>
      <div className="card mortgage-summary mortgage-bar" style={{ position: 'relative' }}>
        <div 
          onMouseEnter={(e) => e.currentTarget.querySelector('.edit-icon').style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.querySelector('.edit-icon').style.opacity = '0'}
          onClick={() => setShowModal(true)}
          style={{ cursor: 'pointer', position: 'relative' }}
        >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Mortgage Group */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '12px', 
              padding: '8px', 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px' 
            }}>
              <div style={{ 
                background: '#ffffff', 
                border: '1px solid #cbd5e1', 
                borderRadius: '8px', 
                padding: '12px 16px',
                minWidth: '110px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#3b82f6', marginBottom: '2px' }}>
                  {formatCurrency(Math.max(0, currentValues.mortgageBalance))}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                  Mortgage
                </div>
              </div>
              
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: '#64748b',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                −
              </div>
              
              <div style={{ 
                background: '#ffffff', 
                border: '1px solid #bbf7d0', 
                borderRadius: '8px', 
                padding: '12px 16px',
                minWidth: '110px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#10b981', marginBottom: '2px' }}>
                  {formatCurrency(currentValues.offsetBalance)}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                  Offset
                </div>
              </div>
              
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: '#64748b',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                =
              </div>
              
              <div style={{ 
                background: '#ffffff', 
                border: '1px solid #fecaca', 
                borderRadius: '8px', 
                padding: '12px 16px',
                minWidth: '110px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#ef4444', marginBottom: '2px' }}>
                  {formatCurrency(Math.max(0, currentValues.effectiveBalance))}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                  Effective
                </div>
              </div>
            </div>
            
            {/* Investment - Separate */}
            <div style={{ 
              background: '#f0fdf4', 
              border: '1px solid #bbf7d0', 
              borderRadius: '8px', 
              padding: '12px 16px',
              minWidth: '120px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#10b981', marginBottom: '2px' }}>
                {formatCurrency(totalInvestmentValue)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                Investment
              </div>
            </div>
            
            <span 
              className="edit-icon"
              style={{ 
                opacity: '0', 
                transition: 'opacity 0.2s',
                fontSize: '18px',
                color: '#3b82f6',
                marginLeft: '8px'
              }}
            >
              ✏️
            </span>
          </div>
          
          {results && (
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="header-card">
                <div className="header-card-value">{formatDate(results.payoffDate)}</div>
                <div className="header-card-label">Payoff Date</div>
              </div>
              <div className="header-card">
                <div className="header-card-value">{formatCurrency(results.interestSaved)}</div>
                <div className="header-card-label">Interest Saved</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Analysis expand button at bottom right edge */}
        {results && (
          <div 
            onClick={(e) => {
              e.stopPropagation(); // Prevent modal from opening
              setShowAnalysis(!showAnalysis);
            }}
            style={{
              position: 'absolute',
              bottom: '-40px',
              right: '16px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '12px',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#f1f5f9';
              e.target.style.borderColor = '#cbd5e1';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#ffffff';
              e.target.style.borderColor = '#e2e8f0';
            }}
          >
            {showAnalysis ? '▲' : '▼'} Analysis
          </div>
        )}
          
        </div>
      </div>

      {results && showAnalysis && (
        <div style={{ 
          margin: '16px 0', 
          padding: '20px', 
          border: '1px solid #e2e8f0', 
          borderRadius: '8px', 
          backgroundColor: '#f8fafc' 
        }}>
          <Results results={results} originalMortgage={mortgageData} />
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Original Mortgage Details</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Loan Amount ($)</label>
                <input
                  type="number"
                  value={mortgageData.principal}
                  onChange={(e) => handleChange('principal', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label>Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={mortgageData.interestRate}
                  onChange={(e) => handleChange('interestRate', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label>Loan Term (Years)</label>
                <input
                  type="number"
                  value={mortgageData.termYears}
                  onChange={(e) => handleChange('termYears', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label>Additional Months</label>
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={mortgageData.termMonths || 0}
                  onChange={(e) => handleChange('termMonths', parseInt(e.target.value) || 0)}
                  placeholder="0-11 months"
                />
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={mortgageData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Payment Day of Month</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={mortgageData.paymentDay || 1}
                  onChange={(e) => handleChange('paymentDay', parseInt(e.target.value) || 1)}
                  placeholder="Day of month (1-28)"
                />
                <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Day of month when your mortgage payment is due
                </small>
              </div>

              <div className="form-group">
                <label>Interest Day of Month</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={mortgageData.interestDay || 1}
                  onChange={(e) => handleChange('interestDay', parseInt(e.target.value) || 1)}
                  placeholder="Day of month (1-28)"
                />
                <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Day of month when interest is charged to your account
                </small>
              </div>

              <div className="form-group">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0'
                }}>
                  <input
                    type="checkbox"
                    id="existingMortgage"
                    checked={mortgageData.isExistingMortgage || false}
                    onChange={(e) => handleChange('isExistingMortgage', e.target.checked)}
                    style={{ 
                      marginTop: '2px',
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <label 
                      htmlFor="existingMortgage"
                      style={{ 
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'block',
                        marginBottom: '4px'
                      }}
                    >
                      Existing Mortgage
                    </label>
                    <small style={{ 
                      fontSize: '12px', 
                      color: '#64748b', 
                      lineHeight: '1.4'
                    }}>
                      Check this if you're analyzing an existing mortgage (not a new loan). Interest will be calculated from the previous interest date.
                    </small>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Offset/Redraw Balance ($)</label>
                <input
                  type="number"
                  value={mortgageData.offsetBalance || 0}
                  onChange={(e) => handleChange('offsetBalance', parseFloat(e.target.value) || 0)}
                  placeholder="Amount in offset/redraw account"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MortgageForm;