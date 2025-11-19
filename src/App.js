import React, { useState, useRef } from 'react';

function App() {
  const [wsUrl, setWsUrl] = useState('');
  const [protocol, setProtocol] = useState('ws');
  const [messageFormat, setMessageFormat] = useState('json'); // 'json' o 'socketio'
  const [socketioPrefix, setSocketioPrefix] = useState('42/RT,');
  const [eventName, setEventName] = useState('GOL message');
  const [keyValuePairs, setKeyValuePairs] = useState([{ key: '', value: '', enabled: true }]);
  const [isConnected, setIsConnected] = useState(false);
  const [messageLog, setMessageLog] = useState([]);
  const [enablePing, setEnablePing] = useState(false);
  const [enableAutoInit, setEnableAutoInit] = useState(true);
  const [initMessage, setInitMessage] = useState('40/RT,');
  const wsRef = useRef(null);
  const hasInitializedRef = useRef(false);

  const handleStartConnection = () => {
    if (wsUrl) {
      const fullUrl = `${protocol}://${wsUrl}`;
      wsRef.current = new WebSocket(fullUrl);
      hasInitializedRef.current = false; // Reset flag

      wsRef.current.onopen = () => {
        setIsConnected(true);
        logMessage('Connected to WebSocket server', 'system');
      };

      wsRef.current.onmessage = (event) => {
        const message = event.data;
        logMessage(message, 'incoming');
        
        // Invia messaggio di inizializzazione quando riceve un messaggio che inizia con "0" (handshake Socket.IO)
        if (enableAutoInit && !hasInitializedRef.current && message.startsWith('0')) {
          hasInitializedRef.current = true;
          wsRef.current.send(initMessage);
          logMessage(initMessage, 'init');
          return; // Non processare ulteriormente questo messaggio
        }
        
        // Se è abilitato il ping e il messaggio è SOLO un numero (ping/pong), rispondi incrementando di 1
        if (enablePing && /^\d+$/.test(message)) {
          const pingNumber = parseInt(message, 10);
          const pongNumber = String(pingNumber + 1);
          wsRef.current.send(pongNumber);
          logMessage(pongNumber, 'pong');
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        logMessage('Disconnected from WebSocket server', 'system');
        hasInitializedRef.current = false; // Reset flag
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
      let messageToSend;

      if (messageFormat === 'socketio') {
      // Formato Socket.IO: 42/RT,["GOL message",{"action":"clientGioca","params":{...}}]
        const jsonPayload = keyValuePairs.reduce((acc, { key, value, enabled }) => {
          if (key && enabled) {
            const raw = value === undefined || value === null ? '' : String(value).trim();

            if (raw === '') {
              acc[key] = '';
            } else if (/^\{.*\}$/.test(raw) || /^\[.*\]$/.test(raw)) {
              try {
                acc[key] = JSON.parse(raw);
              } catch (e) {
                acc[key] = raw;
              }
            } else if (/^(true|false|null)$/i.test(raw)) {
              const lower = raw.toLowerCase();
              acc[key] = lower === 'null' ? null : lower === 'true';
            } else if (!isNaN(raw) && raw !== '') {
              acc[key] = Number(raw);
            } else {
              acc[key] = raw;
            }
          }
          return acc;
        }, {});

        // Costruisce il messaggio Socket.IO
        const socketioMessage = [eventName, jsonPayload];
        messageToSend = socketioPrefix + JSON.stringify(socketioMessage);
      } else {
        // Formato JSON standard (comportamento originale)
        const jsonPayload = keyValuePairs.reduce((acc, { key, value, enabled }) => {
          if (key && enabled) {
            const raw = value === undefined || value === null ? '' : String(value).trim();

            if (raw === '') {
              acc[key] = '';
            } else if (/^\{.*\}$/.test(raw) || /^\[.*\]$/.test(raw)) {
              try {
                acc[key] = JSON.parse(raw);
              } catch (e) {
                acc[key] = raw;
              }
            } else if (/^(true|false|null)$/i.test(raw)) {
              const lower = raw.toLowerCase();
              acc[key] = lower === 'null' ? null : lower === 'true';
            } else if (!isNaN(raw) && raw !== '') {
              acc[key] = Number(raw);
            } else {
              acc[key] = raw;
            }
          }
          return acc;
        }, {});

        messageToSend = JSON.stringify(jsonPayload);
      }

      try {
        wsRef.current.send(messageToSend);
        logMessage(messageToSend, 'outgoing');
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
        <label>
          Message Format:
          <select
            value={messageFormat}
            onChange={(e) => setMessageFormat(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', backgroundColor: '#333', color: '#ffffff', border: '1px solid #555' }}
          >
            <option value="json">JSON Standard</option>
            <option value="socketio">Socket.IO Format</option>
          </select>
        </label>
      </div>

      {messageFormat === 'socketio' && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <label>
              Socket.IO Prefix:
              <input
                type="text"
                value={socketioPrefix}
                onChange={(e) => setSocketioPrefix(e.target.value)}
                placeholder="e.g., 42/RT,"
                style={{ marginLeft: '10px', padding: '5px', width: '20%', backgroundColor: '#333', color: '#ffffff', border: '1px solid #555' }}
              />
            </label>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label>
              Event Name:
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g., GOL message"
                style={{ marginLeft: '10px', padding: '5px', width: '30%', backgroundColor: '#333', color: '#ffffff', border: '1px solid #555' }}
              />
            </label>
          </div>
        </>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={enableAutoInit}
            onChange={(e) => setEnableAutoInit(e.target.checked)}
            style={{ marginRight: '10px', width: '20px', height: '20px', cursor: 'pointer' }}
          />
          Enable Auto Init (invia automaticamente messaggio dopo connessione)
        </label>
        {enableAutoInit && (
          <div style={{ marginTop: '10px', marginLeft: '30px' }}>
            <label>
              Init Message:
              <input
                type="text"
                value={initMessage}
                onChange={(e) => setInitMessage(e.target.value)}
                placeholder="e.g., 40/RT,"
                style={{ marginLeft: '10px', padding: '5px', width: '200px', backgroundColor: '#333', color: '#ffffff', border: '1px solid #555' }}
              />
            </label>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={enablePing}
            onChange={(e) => setEnablePing(e.target.checked)}
            style={{ marginRight: '10px', width: '20px', height: '20px', cursor: 'pointer' }}
          />
          Enable Auto Pong Response (risponde automaticamente ai ping numerici del server)
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
                  color: log.type === 'incoming' ? 'lightgreen' : log.type === 'outgoing' ? 'lightblue' : log.type === 'pong' ? 'yellow' : log.type === 'init' ? 'orange' : log.type === 'error' ? 'red' : '#ffffff',
                  fontWeight: log.type === 'system' ? 'bold' : 'normal',
                }}
              >
                {log.type === 'incoming' ? '⬇️' : log.type === 'outgoing' ? '⬆️' : log.type === 'pong' ? '🏓' : log.type === 'init' ? '🚀' : 'ℹ️'} [{log.time}] {log.type === 'incoming' ? 'Server' : log.type === 'pong' ? 'Pong' : log.type === 'init' ? 'Init' : 'Client'}: {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
