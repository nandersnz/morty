import { useState } from 'react';

function TimelineManager({ timelineEvents, setTimelineEvents }) {
  const [showModal, setShowModal] = useState(false);
  const [showHistoric, setShowHistoric] = useState(false);
  const [newEvent, setNewEvent] = useState({
    date: '',
    type: 'redraw',
    value: '',
    description: ''
  });

  const eventTypes = {
    redraw: 'Redraw',
    deposit: 'Deposit',
    rateChange: 'Interest rate change',
    repaymentChange: 'Repayment change',
    refinance: 'Refinance',
    recast: 'Recast',
    adjustBalance: 'Adjust balance',
    adjustOffset: 'Adjust offset'
  };

  // Separate events into historic and future based on current date
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
  
  const historicEvents = timelineEvents.filter(event => new Date(event.date) < today);
  const futureEvents = timelineEvents.filter(event => new Date(event.date) >= today);

  const addEvent = () => {
    if (!newEvent.date || !newEvent.value) return;

    const event = {
      ...newEvent,
      id: Date.now(),
      value: parseFloat(newEvent.value)
    };

    setTimelineEvents(prev => [...prev, event].sort((a, b) => new Date(a.date) - new Date(b.date)));
    
    setNewEvent({
      date: '',
      type: 'redraw',
      value: '',
      description: ''
    });
    
    setShowModal(false);
  };

  const removeEvent = (id) => {
    setTimelineEvents(prev => prev.filter(event => event.id !== id));
  };

  const renderEvent = (event) => (
    <div key={event.id} className="timeline-item">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: '0 0 5px 0' }}>{eventTypes[event.type]}</h4>
          <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#666' }}>
            <span><strong>Date:</strong> {event.date}</span>
            <span><strong>Value:</strong> {
              event.type === 'rateChange' ? `${event.value}%` : 
              event.type === 'repaymentChange' ? `${event.value.toLocaleString()}` :
              event.type === 'refinance' ? `New Balance: ${event.value.toLocaleString()}` :
              event.type === 'recast' ? `Lump Sum: ${event.value.toLocaleString()}` :
              event.type === 'adjustBalance' ? `Balance: ${event.value.toLocaleString()}` :
              event.type === 'adjustOffset' ? `Offset: ${event.value.toLocaleString()}` :
              `${event.value.toLocaleString()}`
            }</span>
            {event.description && <span><strong>Note:</strong> {event.description}</span>}
          </div>
        </div>
        <button 
          className="btn btn-danger" 
          onClick={() => removeEvent(event.id)}
          style={{ fontSize: '12px', padding: '4px 8px' }}
        >
          Remove
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Timeline Events</h2>
          <button className="btn" onClick={() => setShowModal(true)}>
            Add Event
          </button>
        </div>

        <div>
          {timelineEvents.length === 0 ? (
            <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
              No events added yet. Click "Add Event" to get started.
            </p>
          ) : (
            <>
              {/* Future Events Section */}
              {futureEvents.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ 
                    color: '#1e293b', 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    📅 Future Events ({futureEvents.length})
                  </h3>
                  {futureEvents.map(renderEvent)}
                </div>
              )}

              {/* Historic Events Section */}
              {historicEvents.length > 0 && (
                <div>
                  <div 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      marginBottom: '12px',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => setShowHistoric(!showHistoric)}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ 
                      fontSize: '14px', 
                      transform: showHistoric ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>
                      ▶
                    </span>
                    <h3 style={{ 
                      color: '#64748b', 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      margin: 0
                    }}>
                      📜 Historic Events ({historicEvents.length})
                    </h3>
                  </div>
                  
                  {showHistoric && (
                    <div style={{ 
                      marginLeft: '20px',
                      borderLeft: '2px solid #e2e8f0',
                      paddingLeft: '16px'
                    }}>
                      {historicEvents.map(renderEvent)}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Timeline Event</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Event Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  {Object.entries(eventTypes).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Value ({newEvent.type === 'rateChange' ? '%' : '$'})
                </label>
                <input
                  type="number"
                  step={newEvent.type === 'rateChange' ? '0.01' : '1'}
                  value={newEvent.value}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, value: e.target.value }))}
                  placeholder={
                    newEvent.type === 'rateChange' ? 'New interest rate' :
                    newEvent.type === 'repaymentChange' ? 'New repayment amount' :
                    newEvent.type === 'refinance' ? 'New loan balance' :
                    newEvent.type === 'recast' ? 'Lump sum payment' :
                    newEvent.type === 'deposit' ? 'Deposit amount' :
                    newEvent.type === 'redraw' ? 'Redraw amount' :
                    newEvent.type === 'adjustBalance' ? 'Current loan balance' :
                    newEvent.type === 'adjustOffset' ? 'New offset/redraw balance' : ''
                  }
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add a note about this event"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={addEvent}>
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TimelineManager;