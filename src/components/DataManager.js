import React, { useRef, useState } from 'react';
import { exportData, importData, clearAllData } from '../utils/dataManager';

function DataManager() {
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      clearAllData();
      window.location.reload(); // Refresh to show cleared state
    }
  };

  const handleImportClick = () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: Importing data will completely replace all your current data including:\n\n' +
      '• Mortgage details\n' +
      '• Timeline events\n' +
      '• Investment analysis\n\n' +
      'This action cannot be undone. Make sure to export your current data first if you want to keep it.\n\n' +
      'Do you want to continue with the import?'
    );
    
    if (confirmed) {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      alert('Please select a valid JSON file exported from Morty.');
      return;
    }

    setIsImporting(true);
    
    try {
      const result = await importData(file);
      
      if (result.success) {
        alert('✅ ' + result.message + '\n\nThe page will now refresh to load your imported data.');
        window.location.reload();
      } else {
        alert('❌ ' + result.message);
      }
    } catch (error) {
      alert('❌ ' + error.message);
    } finally {
      setIsImporting(false);
      // Clear the file input so the same file can be selected again
      event.target.value = '';
    }
  };

  return (
    <div className="data-manager">
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button className="btn" onClick={exportData}>
          Export Data
        </button>
        
        <button 
          className="btn" 
          onClick={handleImportClick}
          disabled={isImporting}
          style={{ 
            background: isImporting ? '#9ca3af' : '#10b981',
            borderColor: isImporting ? '#9ca3af' : '#10b981'
          }}
        >
          {isImporting ? 'Importing...' : 'Import Data'}
        </button>
        
        <button 
          className="btn btn-danger" 
          onClick={handleClearData}
        >
          Clear All Data
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}

export default DataManager;