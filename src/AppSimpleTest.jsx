import React from 'react';

// Minimal test component
function AppSimpleTest() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial', 
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1>🚗 SkaEV - Simple Test</h1>
      <p>If you see this, React is working!</p>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
        <h2>✅ Status Check:</h2>
        <ul>
          <li>✅ Frontend: Running on port {window.location.port}</li>
          <li>✅ React: Loaded successfully</li>
          <li>🔄 Backend: Testing...</li>
        </ul>
        
        <button 
          onClick={() => {
            fetch('http://localhost:5000/health')
              .then(res => res.text())
              .then(data => alert('Backend: ' + data))
              .catch(err => alert('Backend Error: ' + err.message));
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Test Backend Connection
        </button>
      </div>
    </div>
  );
}

export default AppSimpleTest;
