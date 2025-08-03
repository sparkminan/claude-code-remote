import { create } from 'zustand';

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error';
  text: string;
  timestamp: number;
}

interface AppState {
  isAuthenticated: boolean;
  token: string | null;
  serverUrl: string;
  wsStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  terminalLines: TerminalLine[];
  ws: WebSocket | null;
  
  setAuthenticated: (isAuthenticated: boolean, token?: string) => void;
  setServerUrl: (url: string) => void;
  setWsStatus: (status: AppState['wsStatus']) => void;
  addTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  clearTerminal: () => void;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  sendCommand: (command: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  token: localStorage.getItem('claude-remote-token'),
  serverUrl: localStorage.getItem('claude-remote-server') || 'ws://localhost:8080',
  wsStatus: 'disconnected',
  terminalLines: [],
  ws: null,

  setAuthenticated: (isAuthenticated, token) => {
    if (token) {
      localStorage.setItem('claude-remote-token', token);
    } else {
      localStorage.removeItem('claude-remote-token');
    }
    set({ isAuthenticated, token });
  },

  setServerUrl: (url) => {
    localStorage.setItem('claude-remote-server', url);
    set({ serverUrl: url });
  },

  setWsStatus: (status) => set({ wsStatus: status }),

  addTerminalLine: (line) => {
    const newLine: TerminalLine = {
      ...line,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    set((state) => ({ 
      terminalLines: [...state.terminalLines, newLine].slice(-1000) 
    }));
  },

  clearTerminal: () => set({ terminalLines: [] }),

  connectWebSocket: () => {
    const { serverUrl, token, ws } = get();
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      return;
    }

    set({ wsStatus: 'connecting' });
    
    // WebSocketエンドポイントを調整（/wsパスを追加）
    const wsUrl = serverUrl.replace(/\/$/, '') + '/ws';
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      set({ wsStatus: 'connected', ws: websocket });
      websocket.send(JSON.stringify({ type: 'auth', token }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'auth':
          if (data.status !== 'success') {
            get().setAuthenticated(false);
            websocket.close();
          }
          break;
          
        case 'output':
          get().addTerminalLine({ type: 'output', text: data.text });
          break;
          
        case 'error':
          get().addTerminalLine({ type: 'error', text: data.text || data.message });
          break;
          
        case 'processEnd':
          get().addTerminalLine({ 
            type: 'output', 
            text: `\nProcess exited with code ${data.code}` 
          });
          break;
      }
    };

    websocket.onerror = () => {
      set({ wsStatus: 'error' });
    };

    websocket.onclose = () => {
      set({ wsStatus: 'disconnected', ws: null });
      
      // エクスポネンシャルバックオフで再接続
      const reconnect = (attempt = 0) => {
        if (!get().isAuthenticated) return;
        
        const maxDelay = 30000; // 最大30秒
        const delay = Math.min(1000 * Math.pow(2, attempt), maxDelay);
        
        console.log(`Reconnecting in ${delay / 1000} seconds... (attempt ${attempt + 1})`);
        
        setTimeout(() => {
          if (get().isAuthenticated && get().wsStatus === 'disconnected') {
            get().connectWebSocket();
            // 次回の再接続試行のためにattemptを増やす
            if (get().wsStatus === 'disconnected') {
              reconnect(attempt + 1);
            }
          }
        }, delay);
      };
      
      reconnect();
    };
  },

  disconnectWebSocket: () => {
    const { ws } = get();
    if (ws) {
      ws.close();
      set({ ws: null, wsStatus: 'disconnected' });
    }
  },

  sendCommand: (command) => {
    const { ws, wsStatus } = get();
    
    if (!ws || wsStatus !== 'connected') {
      get().addTerminalLine({ 
        type: 'error', 
        text: 'Not connected to server' 
      });
      return;
    }

    get().addTerminalLine({ type: 'command', text: `> ${command}` });
    ws.send(JSON.stringify({ type: 'command', text: command }));
  }
}));