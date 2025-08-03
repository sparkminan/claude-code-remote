import { useEffect, useRef } from 'react';
import { useStore } from '../store';

export const useReconnect = () => {
  const { wsStatus, isAuthenticated } = useStore();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    // ネットワーク状態の監視
    const handleOnline = () => {
      console.log('Network is back online');
      if (isAuthenticated && wsStatus === 'disconnected') {
        // ネットワークが復旧したらすぐに再接続
        attemptRef.current = 0;
        useStore.getState().connectWebSocket();
      }
    };

    const handleOffline = () => {
      console.log('Network is offline');
      // オフライン時は再接続を停止
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    // Visibility API - ブラウザタブがアクティブになったら再接続
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && wsStatus === 'disconnected') {
        console.log('Tab is active, attempting reconnection');
        attemptRef.current = 0;
        useStore.getState().connectWebSocket();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [wsStatus, isAuthenticated]);

  return {
    isOnline: navigator.onLine,
    reconnectAttempts: attemptRef.current
  };
};