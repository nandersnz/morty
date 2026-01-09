import React, { useState, useEffect } from 'react';
import MortgageForm from './components/MortgageForm';
import TimelineManager from './components/TimelineManager';
import Results from './components/Results';
import DataManager from './components/DataManager';
import InvestmentManager from './components/InvestmentManager';
import { calculateMortgage } from './utils/mortgageCalculator';

// Import the logo directly
import mortyLogo from './morty-logo.png';

function App() {
  const [mortgageData, setMortgageData] = useState({
    principal: 400000,
    interestRate: 3.5,
    termYears: 30,
    termMonths: 0,
    startDate: new Date().toISOString().split('T')[0],
    offsetBalance: 0,
    paymentDay: 1,
    interestDay: 1,
    isExistingMortgage: false
  });

  const [timelineEvents, setTimelineEvents] = useState([]);
  const [results, setResults] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('ledger');
  const [investments, setInvestments] = useState([]);
  const [showAnalysis, setShowAnalysis] = useState(false);

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

  // Load data from localStorage on component mount
  useEffect(() => {
    console.log('Loading data from localStorage...');
    const savedMortgageData = localStorage.getItem('mortgageAnalyzer_mortgageData');
    const savedTimelineEvents = localStorage.getItem('mortgageAnalyzer_timelineEvents');
    const savedInvestments = localStorage.getItem('mortgageAnalyzer_investments');

    console.log('Saved mortgage data:', savedMortgageData);
    console.log('Saved timeline events:', savedTimelineEvents);
    console.log('Saved investments:', savedInvestments);

    if (savedMortgageData) {
      try {
        const parsedData = JSON.parse(savedMortgageData);
        console.log('Parsed mortgage data:', parsedData);
        setMortgageData(parsedData);
      } catch (error) {
        console.error('Error loading mortgage data:', error);
      }
    }

    if (savedTimelineEvents) {
      try {
        const parsedEvents = JSON.parse(savedTimelineEvents);
        console.log('Parsed timeline events:', parsedEvents);
        setTimelineEvents(parsedEvents);
      } catch (error) {
        console.error('Error loading timeline events:', error);
      }
    }

    if (savedInvestments) {
      try {
        const parsedInvestments = JSON.parse(savedInvestments);
        console.log('Parsed investments:', parsedInvestments);
        setInvestments(parsedInvestments);
      } catch (error) {
        console.error('Error loading investments:', error);
      }
    }
    
    setDataLoaded(true);
  }, []);

  // Save mortgage data to localStorage whenever it changes (but only after initial load)
  useEffect(() => {
    if (dataLoaded) {
      console.log('Saving mortgage data:', mortgageData);
      localStorage.setItem('mortgageAnalyzer_mortgageData', JSON.stringify(mortgageData));
    }
  }, [mortgageData, dataLoaded]);

  // Save timeline events to localStorage whenever they change (but only after initial load)
  useEffect(() => {
    if (dataLoaded) {
      console.log('Saving timeline events:', timelineEvents);
      localStorage.setItem('mortgageAnalyzer_timelineEvents', JSON.stringify(timelineEvents));
    }
  }, [timelineEvents, dataLoaded]);

  // Save investments to localStorage whenever they change (but only after initial load)
  useEffect(() => {
    if (dataLoaded) {
      console.log('Saving investments:', investments);
      localStorage.setItem('mortgageAnalyzer_investments', JSON.stringify(investments));
    }
  }, [investments, dataLoaded]);

  // Calculate results whenever mortgage data or timeline events change
  useEffect(() => {
    console.log('Recalculating mortgage results due to data change');
    console.log('Mortgage data:', mortgageData);
    console.log('Timeline events:', timelineEvents);
    const calculatedResults = calculateMortgage(mortgageData, timelineEvents);
    setResults(calculatedResults);
  }, [mortgageData, timelineEvents]);

  return (
    <div className="app">
      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img 
              src={mortyLogo}
              alt="Morty Logo" 
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%',
                objectFit: 'cover'
              }} 
              onError={(e) => {
                console.log('Logo failed to load:', e);
                e.target.style.display = 'none';
              }}
            />
            <h1>Morty</h1>
          </div>
          <DataManager />
        </div>
      </header>

      <MortgageForm 
        mortgageData={mortgageData}
        setMortgageData={setMortgageData}
        results={results}
        investments={investments}
        timelineEvents={timelineEvents}
        showAnalysis={showAnalysis}
        setShowAnalysis={setShowAnalysis}
      />

      <div className="tab-container">
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => setActiveTab('ledger')}
          >
            Ledger
          </button>
          <button 
            className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
          <button 
            className={`tab-button ${activeTab === 'investments' ? 'active' : ''}`}
            onClick={() => setActiveTab('investments')}
          >
            Investments
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'ledger' && (
            <div className="main-content">
              <div className="card">
                <h2>Transaction Ledger</h2>
                
                {results && results.transactions ? (
                  <div>
                    <div style={{ marginBottom: '16px', fontSize: '14px', color: '#64748b' }}>
                      Total Transactions: {results.transactions.length}
                    </div>
                    
                    <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Transaction Type</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Min Payment</th>
                            <th>Mortgage Balance</th>
                            <th>Offset/Redraw Balance</th>
                            <th>Effective Balance</th>
                            <th>Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.transactions.map((transaction, index) => (
                            <tr key={index} style={{ 
                              backgroundColor: transaction.type === 'Interest Charge' ? '#fef3c7' : 
                                              transaction.type === 'Monthly Payment' ? '#f0f9ff' :
                                              transaction.type === 'Payment to Offset' ? '#e0f2fe' :
                                              transaction.type === 'Deposit' ? '#f0fdf4' :
                                              transaction.type === 'Redraw' ? '#fef2f2' :
                                              index % 2 === 0 ? '#f8fafc' : 'transparent'
                            }}>
                              <td>{formatDate(transaction.date)}</td>
                              <td style={{ fontWeight: '500' }}>{transaction.type}</td>
                              <td style={{ fontSize: '12px', color: '#64748b' }}>
                                {transaction.description}
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
                              <td style={{ fontSize: '12px', color: '#64748b' }}>
                                {transaction.minimumPayment !== undefined ? formatCurrency(transaction.minimumPayment) : '-'}
                              </td>
                              <td>{formatCurrency(transaction.amortizedPrincipal)}</td>
                              <td style={{ color: transaction.redrawOffsetPool > 0 ? '#16a34a' : 'inherit' }}>
                                {formatCurrency(transaction.redrawOffsetPool)}
                              </td>
                              <td style={{ 
                                fontWeight: '500',
                                color: transaction.netInterestBearingBalance === 0 ? '#16a34a' : 'inherit'
                              }}>
                                {formatCurrency(transaction.netInterestBearingBalance)}
                              </td>
                              <td>{transaction.rate}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No transaction data available. Please check your mortgage settings.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="main-content">
              <TimelineManager 
                timelineEvents={timelineEvents}
                setTimelineEvents={setTimelineEvents}
              />
            </div>
          )}

          {activeTab === 'investments' && (
            <InvestmentManager 
              investments={investments}
              setInvestments={setInvestments}
              mortgageData={mortgageData}
              results={results}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;