import React, { useState, useRef, useEffect } from 'react';
import { useStore } from './store';
import { useReconnect } from './hooks/useReconnect';
import Login from './components/Login';
import PresetLogin from './components/PresetLogin';
import LoginDebug from './components/LoginDebug';
import SuperSimpleLogin from './components/SuperSimpleLogin';
import FixedApp from './components/FixedApp';
import Terminal from './components/Terminal';
import CommandInput from './components/CommandInput';
import StatusBar from './components/StatusBar';
import ConnectionStatus from './components/ConnectionStatus';
import './App.css';

function App() {
  const { isAuthenticated, wsStatus } = useStore();
  const { isOnline } = useReconnect();

  // 認証状態をlocalStorageから復元
  const hasToken = !!localStorage.getItem('claude-remote-token');
  
  if (!hasToken && !isAuthenticated) {
    return <PresetLogin />;
  }

  return (
    <div className="app">
      <StatusBar />
      {!isOnline && <ConnectionStatus />}
      <Terminal />
      <CommandInput />
    </div>
  );
}

export default App;