import React from 'react';

const ConnectionStatus: React.FC = () => {
  return (
    <div className="connection-status-banner">
      <div className="connection-status-content">
        <span className="connection-status-icon">⚠️</span>
        <span className="connection-status-text">
          ネットワークに接続されていません。接続が復旧すると自動的に再接続されます。
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;