import React, { useState } from 'react';
import { mentalHealthAPI } from '../services/api';

function TestBackend() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState('');

  const testConnection = async () => {
    setLoading(true);
    setTestType('session');
    try {
      const data = await mentalHealthAPI.startSession('questionnaire');
      setResult(JSON.stringify(data, null, 2));
      console.log('✅ Success!', data);
    } catch (error) {
      setResult('❌ Error: ' + error.message);
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const testConditions = async () => {
    setLoading(true);
    setTestType('conditions');
    try {
      const data = await mentalHealthAPI.getConditions();
      setResult(JSON.stringify(data, null, 2));
      console.log('✅ Success!', data);
    } catch (error) {
      setResult('❌ Error: ' + error.message);
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const testChatSession = async () => {
    setLoading(true);
    setTestType('chat');
    try {
      const data = await mentalHealthAPI.startSession('chat');
      setResult(JSON.stringify(data, null, 2));
      console.log('✅ Success!', data);
    } catch (error) {
      setResult('❌ Error: ' + error.message);
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧠 Mental Health Backend Test</h1>
      <p>Backend server: <strong style={{color: 'green'}}>http://localhost:5000</strong></p>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button 
          onClick={testConnection} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading && testType === 'session' ? 'Testing...' : 'Test Questionnaire'}
        </button>

        <button 
          onClick={testChatSession} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading && testType === 'chat' ? 'Testing...' : 'Test Chat'}
        </button>

        <button 
          onClick={testConditions} 
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading && testType === 'conditions' ? 'Testing...' : 'Test Get Conditions'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '30px' }}>
          <h3>Response:</h3>
          <pre style={{
            background: '#f5f5f5',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            maxHeight: '500px',
            overflow: 'auto',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}

export default TestBackend;