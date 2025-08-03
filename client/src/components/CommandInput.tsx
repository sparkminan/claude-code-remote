import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { useCommandHistory } from '../hooks/useCommandHistory';

const CommandInput: React.FC = () => {
  const [command, setCommand] = useState('');
  const [tempCommand, setTempCommand] = useState('');
  const { sendCommand, wsStatus } = useStore();
  const { addToHistory, navigateHistory, history } = useCommandHistory();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && wsStatus === 'connected') {
      sendCommand(command);
      addToHistory(command);
      setCommand('');
      setTempCommand('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      // 初回の上キー押下時は現在のコマンドを保存
      if (tempCommand === '' && command !== '') {
        setTempCommand(command);
      }
      const historicalCommand = navigateHistory('up');
      if (historicalCommand !== null) {
        setCommand(historicalCommand);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const historicalCommand = navigateHistory('down');
      if (historicalCommand !== null) {
        setCommand(historicalCommand === '' ? tempCommand : historicalCommand);
      }
    } else if (e.key === 'Escape') {
      // ESCで履歴ナビゲーションをリセット
      setCommand(tempCommand || '');
      setTempCommand('');
    }
  };

  const quickCommands = [
    'help',
    'clear',
    'exit',
    'ls',
    'pwd',
    'git status'
  ];

  const handleQuickCommand = (cmd: string) => {
    if (wsStatus === 'connected') {
      sendCommand(cmd);
    }
  };

  return (
    <>
      <div className="quick-actions">
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            className="quick-action-button"
            onClick={() => handleQuickCommand(cmd)}
          >
            {cmd}
          </button>
        ))}
      </div>
      
      <div className="command-input-container">
        <form onSubmit={handleSubmit} className="command-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="command-input"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            disabled={wsStatus !== 'connected'}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!command.trim() || wsStatus !== 'connected'}
          >
            →
          </button>
        </form>
      </div>
    </>
  );
};

export default CommandInput;