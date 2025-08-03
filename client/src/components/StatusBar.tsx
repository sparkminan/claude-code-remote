import React from 'react';
import { useStore } from '../store';

const StatusBar: React.FC = () => {
  const { wsStatus, disconnectWebSocket, setAuthenticated } = useStore();

  const getStatusText = () => {
    switch (wsStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  const handleDisconnect = () => {
    disconnectWebSocket();
    setAuthenticated(false);
  };

  return (
    <div className="status-bar">
      <div className="status-indicator">
        <div className={`status-dot ${wsStatus}`} />
        <span>{getStatusText()}</span>
      </div>
      <button 
        onClick={handleDisconnect}
        style={{
          background: 'none',
          border: 'none',
          color: '#999',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Disconnect
      </button>
    </div>
  );
};

export default StatusBar;