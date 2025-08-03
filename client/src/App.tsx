import React, { useState, useRef, useEffect } from 'react';
import { useStore } from './store';
import { useReconnect } from './hooks/useReconnect';
import Login from './components/Login';
import Terminal from './components/Terminal';
import CommandInput from './components/CommandInput';
import StatusBar from './components/StatusBar';
import ConnectionStatus from './components/ConnectionStatus';
import './App.css';

function App() {
  const { isAuthenticated, wsStatus } = useStore();
  const { isOnline } = useReconnect();

  if (!isAuthenticated) {
    return <Login />;
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