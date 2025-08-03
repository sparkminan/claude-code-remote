import React, { useState } from 'react';
import { useStore } from '../store';

const Login: React.FC = () => {
  const [serverUrl, setServerUrl] = useState('http://localhost:8080');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
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
      setError('Failed to connect to server. If using HTTPS, please accept the certificate first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1 className="login-title">Claude Code Remote</h1>
        
        <div className="login-input-group">
          <label className="login-label" htmlFor="server">Server URL</label>
          <input
            id="server"
            type="text"
            className="login-input"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            required
          />
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
          />
        </div>

        <div className="login-input-group">
          <label className="login-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button 
          type="submit" 
          className="login-button"
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Connect'}
        </button>

        {error && <div className="login-error">{error}</div>}
      </form>
    </div>
  );
};

export default Login;