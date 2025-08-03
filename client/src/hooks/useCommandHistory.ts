import { useState, useCallback, useEffect } from 'react';

const HISTORY_KEY = 'claude-remote-command-history';
const MAX_HISTORY = 100;

export const useCommandHistory = () => {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 履歴をローカルストレージから読み込み
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
      } catch (e) {
        console.error('Failed to load command history:', e);
      }
    }
  }, []);

  // 履歴をローカルストレージに保存
  const saveHistory = useCallback((newHistory: string[]) => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  }, []);

  // コマンドを履歴に追加
  const addToHistory = useCallback((command: string) => {
    if (!command.trim()) return;

    setHistory(prev => {
      // 重複を削除（最新のものを残す）
      const filtered = prev.filter(cmd => cmd !== command);
      const newHistory = [command, ...filtered].slice(0, MAX_HISTORY);
      saveHistory(newHistory);
      return newHistory;
    });
    setHistoryIndex(-1);
  }, [saveHistory]);

  // 履歴をナビゲート
  const navigateHistory = useCallback((direction: 'up' | 'down') => {
    if (history.length === 0) return null;

    let newIndex = historyIndex;
    
    if (direction === 'up') {
      newIndex = Math.min(historyIndex + 1, history.length - 1);
    } else {
      newIndex = Math.max(historyIndex - 1, -1);
    }

    setHistoryIndex(newIndex);
    return newIndex === -1 ? '' : history[newIndex];
  }, [history, historyIndex]);

  // 履歴をクリア
  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  // 履歴の検索
  const searchHistory = useCallback((query: string) => {
    if (!query) return history;
    return history.filter(cmd => 
      cmd.toLowerCase().includes(query.toLowerCase())
    );
  }, [history]);

  return {
    history,
    historyIndex,
    addToHistory,
    navigateHistory,
    clearHistory,
    searchHistory
  };
};