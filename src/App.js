import React, { useState, useRef } from 'react';

function App() {
  const [wsUrl, setWsUrl] = useState('');
  const [protocol, setProtocol] = useState('ws');
  const [keyValuePairs, setKeyValuePairs] = useState([{ key: '', value: '', enabled: true }]);
  const [isConnected, setIsConnected] = useState(false);
  const [messageLog, setMessageLog] = useState([]);
  const wsRef = useRef(null);

  const handleStartConnection = () => {
    if (wsUrl) {
      const fullUrl = `${protocol}://${wsUrl}`;
      wsRef.current = new WebSocket(fullUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        logMessage('Connected to WebSocket server', 'system');
      };

      wsRef.current.onmessage = (event) => {
        logMessage(event.data, 'incoming');
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        logMessage('Disconnected from WebSocket server', 'system');
      };

      wsRef.current.onerror = (error) => {
        logMessage(`Error: ${error.message}`, 'error');
      };
    } else {
      alert('Please enter a valid WebSocket URL.');
    }
  };

  const logMessage = (message, type) => {
    setMessageLog((prevLog) => [...prevLog, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  const handleSendMessage = () => {
    if (wsRef.current && isConnected) {
      const jsonPayload = keyValuePairs.reduce((acc, { key, value, enabled }) => {
        if (key && enabled) {
          const raw = value === undefined || value === null ? '' : String(value).trim();

          if (raw === '') {
            acc[key] = '';
          } else if (/^\{.*\}$/.test(raw) || /^\[.*\]$/.test(raw)) {
            // Se il valore sembra un oggetto o array JSON, prova a parsearlo
            try {
              acc[key] = JSON.parse(raw);
            } catch (e) {
              // Se il parse fallisce, mantieni come stringa
              acc[key] = raw;
            }
          } else if (/^(true|false|null)$/i.test(raw)) {
            // Gestisci booleani e null
            const lower = raw.toLowerCase();
            acc[key] = lower === 'null' ? null : lower === 'true';
          } else if (!isNaN(raw) && raw !== '') {
            // Se è un numero, convertilo
            acc[key] = Number(raw);
          } else {
            // Altrimenti mantieni come stringa
            acc[key] = raw;
          }
        }
        return acc;
      }, {});

      try {
        wsRef.current.send(JSON.stringify(jsonPayload));
        logMessage(JSON.stringify(jsonPayload), 'outgoing');
      } catch (error) {
        alert('Failed to send message');
      }
    } else {
      alert('You need to establish a WebSocket connection first.');
    }
  };

  const addKeyValuePair = () => {
    setKeyValuePairs([...keyValuePairs, { key: '', value: '', enabled: true }]);
  };

  const removeKeyValuePair = (index) => {
    setKeyValuePairs(keyValuePairs.filter((_, i) => i !== index));
  };

  const updateKeyValuePair = (index, field, value) => {
    const newPairs = [...keyValuePairs];
    newPairs[index][field] = value;
    setKeyValuePairs(newPairs);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#121212', color: '#ffffff' }}>
      <h1 style={{ color: '#ffffff' }}>WebSocket Client</h1>
      <div style={{ marginBottom: '20px' }}>
        <label>
          WebSocket Server URL:
          <input
            type="text"
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            placeholder="Enter server URL without ws:// or wss://"
            style={{ marginLeft: '10px', padding: '5px', width: '60%', backgroundColor: '#333', color: '#ffffff', border: '1px solid #555' }}
          />
        </label>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label>
          Protocol:
          <select
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', backgroundColor: '#333', color: '#ffffff', border: '1px solid #555' }}
          >
            <option value="ws">ws</option>
            <option value="wss">wss</option>
          </select>
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffffff' }}>JSON Payload (Key-Value Pairs)</h3>
        {keyValuePairs.map((pair, index) => (
          <div key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={pair.enabled}
              onChange={(e) => updateKeyValuePair(index, 'enabled', e.target.checked)}
              style={{ marginRight: '10px', width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <input
              type="text"
              placeholder="Key"
              value={pair.key}
              onChange={(e) => updateKeyValuePair(index, 'key', e.target.value)}
              style={{ marginRight: '10px', padding: '5px', width: '30%', backgroundColor: '#333', color: '#ffffff', border: '1px solid #555', opacity: pair.enabled ? 1 : 0.5 }}
              disabled={!pair.enabled}
            />
            <input
              type="text"
              placeholder="Value"
              value={pair.value}
              onChange={(e) => updateKeyValuePair(index, 'value', e.target.value)}
              style={{ marginRight: '10px', padding: '5px', width: '30%', backgroundColor: '#333', color: '#ffffff', border: '1px solid #555', opacity: pair.enabled ? 1 : 0.5 }}
              disabled={!pair.enabled}
            />
            <button onClick={() => removeKeyValuePair(index)} style={{ padding: '5px', backgroundColor: 'red', color: 'white' }}>
              Remove
            </button>
          </div>
        ))}
        <button onClick={addKeyValuePair} style={{ padding: '10px', backgroundColor: 'green', color: 'white' }}>
          + Add Key-Value Pair
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleStartConnection}
          style={{ marginRight: '10px', padding: '10px', backgroundColor: 'green', color: 'white' }}
        >
          Start Connection
        </button>
        <button
          onClick={handleSendMessage}
          disabled={!isConnected}
          style={{ padding: '10px', backgroundColor: isConnected ? 'blue' : 'gray', color: 'white' }}
        >
          Send Message
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#ffffff' }}>Messages Log:</h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '10px',
            padding: '10px',
            width: '60%',
            height: '200px',
            backgroundColor: '#1e1e1e',
            overflowY: 'scroll',
            border: '1px solid #555',
          }}
        >
          {messageLog.map((log, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <span
                style={{
                  color: log.type === 'incoming' ? 'lightgreen' : log.type === 'outgoing' ? 'lightblue' : log.type === 'error' ? 'red' : '#ffffff',
                  fontWeight: log.type === 'system' ? 'bold' : 'normal',
                }}
              >
                {log.type === 'incoming' ? '⬇️' : log.type === 'outgoing' ? '⬆️' : 'ℹ️'} [{log.time}] {log.type === 'incoming' ? 'Server' : 'Client'}: {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
