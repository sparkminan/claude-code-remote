import React, { useState } from 'react';
import { useStore } from '../store';

const PresetLogin: React.FC = () => {
  const [serverUrl, setServerUrl] = useState('http://localhost:9002');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { setAuthenticated, setServerUrl: updateServerUrl } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${serverUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // HTTPSの場合はwss、HTTPの場合はwsを使用
        const wsUrl = serverUrl.replace('https', 'wss').replace('http', 'ws');
        updateServerUrl(wsUrl);
        setAuthenticated(true, data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Failed to connect to server. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const quickConnect = () => {
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1 className="login-title">Claude Code Remote</h1>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
          Remote control for Claude Code on Windows
        </p>
        
        <div className="login-input-group">
          <label className="login-label" htmlFor="server">Server URL</label>
          <input
            id="server"
            type="text"
            className="login-input"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            required
            placeholder="http://localhost:9001"
          />
          <small style={{ color: '#888', fontSize: '12px' }}>
            HTTPSを使用する場合: https://localhost:9001
          </small>
        </div>

        <div className="login-input-group">
          <label className="login-label" htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            className="login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            placeholder="admin"
          />
        </div>

        <div className="login-input-group">
          <label className="login-label" htmlFor="password">
            Password
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                marginLeft: '10px',
                background: 'none',
                border: 'none',
                color: '#007AFF',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {showPassword ? '隠す' : '表示'}
            </button>
          </label>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="password123"
          />
        </div>

        <button 
          type="submit" 
          className="login-button"
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Connect'}
        </button>

        <button 
          type="button" 
          onClick={quickConnect}
          className="login-button"
          style={{ 
            marginTop: '10px', 
            backgroundColor: '#28a745',
            opacity: loading ? 0.5 : 1
          }}
          disabled={loading}
        >
          Quick Connect (Default Settings)
        </button>

        {error && <div className="login-error">{error}</div>}
        
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          <p><strong>デフォルト認証情報:</strong></p>
          <p>Username: admin</p>
          <p>Password: password123</p>
        </div>
      </form>
    </div>
  );
};

export default PresetLogin;