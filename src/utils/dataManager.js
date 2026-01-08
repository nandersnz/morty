// Data management utilities for local storage

export const exportData = () => {
  const mortgageData = localStorage.getItem('mortgageAnalyzer_mortgageData');
  const timelineEvents = localStorage.getItem('mortgageAnalyzer_timelineEvents');
  const investments = localStorage.getItem('mortgageAnalyzer_investments');
  
  const exportObject = {
    mortgageData: mortgageData ? JSON.parse(mortgageData) : null,
    timelineEvents: timelineEvents ? JSON.parse(timelineEvents) : [],
    investments: investments ? JSON.parse(investments) : [],
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  const dataStr = JSON.stringify(exportObject, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `morty-analysis-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Validate the imported data structure
        if (!importedData || typeof importedData !== 'object') {
          throw new Error('Invalid file format');
        }
        
        // Clear existing data first
        clearAllData();
        
        // Import mortgage data
        if (importedData.mortgageData) {
          localStorage.setItem('mortgageAnalyzer_mortgageData', JSON.stringify(importedData.mortgageData));
        }
        
        // Import timeline events
        if (importedData.timelineEvents && Array.isArray(importedData.timelineEvents)) {
          localStorage.setItem('mortgageAnalyzer_timelineEvents', JSON.stringify(importedData.timelineEvents));
        }
        
        // Import investments (if available)
        if (importedData.investments && Array.isArray(importedData.investments)) {
          localStorage.setItem('mortgageAnalyzer_investments', JSON.stringify(importedData.investments));
        }
        
        resolve({
          success: true,
          message: 'Data imported successfully!',
          data: importedData
        });
        
      } catch (error) {
        reject({
          success: false,
          message: 'Failed to import data. Please check the file format.',
          error: error.message
        });
      }
    };
    
    reader.onerror = () => {
      reject({
        success: false,
        message: 'Failed to read the file.',
        error: 'File read error'
      });
    };
    
    reader.readAsText(file);
  });
};

export const clearAllData = () => {
  localStorage.removeItem('mortgageAnalyzer_mortgageData');
  localStorage.removeItem('mortgageAnalyzer_timelineEvents');
  localStorage.removeItem('mortgageAnalyzer_investments');
};