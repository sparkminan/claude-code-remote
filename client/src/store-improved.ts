import { create } from 'zustand';

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error' | 'system';
  text: string;
  timestamp: number;
}

interface AppState {
  isAuthenticated: boolean;
  token: string | null;
  serverUrl: string;
  wsStatus: 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';
  terminalLines: TerminalLine[];
  ws: WebSocket | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  autoReconnect: boolean;
  heartbeatInterval: NodeJS.Timeout | null;
  
  setAuthenticated: (isAuthenticated: boolean, token?: string) => void;
  setServerUrl: (url: string) => void;
  setWsStatus: (status: AppState['wsStatus']) => void;
  addTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  clearTerminal: () => void;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  sendCommand: (command: string) => void;
  setAutoReconnect: (enabled: boolean) => void;
  resetReconnectAttempts: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  token: localStorage.getItem('claude-remote-token'),
  serverUrl: localStorage.getItem('claude-remote-server') || 'ws://localhost:8082',
  wsStatus: 'disconnected',
  terminalLines: [],
  ws: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  autoReconnect: true,
  heartbeatInterval: null,

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
    const { serverUrl, token, wsStatus, heartbeatInterval } = get();
    
    // Clear existing heartbeat
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      set({ heartbeatInterval: null });
    }
    
    // Don't create new connection if already connected
    if (wsStatus === 'connected' || wsStatus === 'connecting') {
      return;
    }

    set({ wsStatus: 'connecting' });
    get().addTerminalLine({ 
      type: 'system', 
      text: 'Connecting to server...' 
    });
    
    // Create WebSocket connection
    const wsUrl = serverUrl.replace(/^http/, 'ws').replace(/\/$/, '');
    const websocket = new WebSocket(wsUrl);
    
    // Connection timeout
    const connectionTimeout = setTimeout(() => {
      if (websocket.readyState === WebSocket.CONNECTING) {
        websocket.close();
        get().addTerminalLine({ 
          type: 'error', 
          text: 'Connection timeout' 
        });
      }
    }, 10000);
    
    websocket.onopen = () => {
      clearTimeout(connectionTimeout);
      set({ wsStatus: 'connected', ws: websocket });
      get().resetReconnectAttempts();
      
      // Send authentication
      websocket.send(JSON.stringify({ type: 'auth', token }));
      
      get().addTerminalLine({ 
        type: 'system', 
        text: '✅ Connected to server' 
      });
      
      // Start heartbeat
      const interval = setInterval(() => {
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Send ping every 30 seconds
      
      set({ heartbeatInterval: interval });
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'auth':
            if (!data.success) {
              get().addTerminalLine({ 
                type: 'error', 
                text: '❌ Authentication failed' 
              });
              get().setAuthenticated(false);
              websocket.close();
            } else {
              get().addTerminalLine({ 
                type: 'system', 
                text: '✅ Authenticated successfully' 
              });
            }
            break;
            
          case 'output':
            get().addTerminalLine({ type: 'output', text: data.text });
            break;
            
          case 'error':
            get().addTerminalLine({ 
              type: 'error', 
              text: data.text || data.message || 'Unknown error' 
            });
            break;
            
          case 'complete':
            get().addTerminalLine({ 
              type: 'system', 
              text: `Process completed with exit code: ${data.code}` 
            });
            break;
            
          case 'pong':
            // Heartbeat response received
            break;
            
          default:
            console.warn('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        get().addTerminalLine({ 
          type: 'error', 
          text: 'Error parsing server response' 
        });
      }
    };

    websocket.onerror = (error) => {
      clearTimeout(connectionTimeout);
      console.error('WebSocket error:', error);
      set({ wsStatus: 'error' });
      get().addTerminalLine({ 
        type: 'error', 
        text: '❌ Connection error' 
      });
    };

    websocket.onclose = (event) => {
      clearTimeout(connectionTimeout);
      
      // Clear heartbeat
      if (get().heartbeatInterval) {
        clearInterval(get().heartbeatInterval);
        set({ heartbeatInterval: null });
      }
      
      set({ ws: null });
      
      const wasConnected = get().wsStatus === 'connected';
      
      if (event.wasClean) {
        set({ wsStatus: 'disconnected' });
        get().addTerminalLine({ 
          type: 'system', 
          text: 'Disconnected from server' 
        });
      } else {
        set({ wsStatus: 'error' });
        get().addTerminalLine({ 
          type: 'error', 
          text: `Connection lost (code: ${event.code})` 
        });
      }
      
      // Auto-reconnect logic
      if (get().autoReconnect && get().isAuthenticated && wasConnected) {
        const { reconnectAttempts, maxReconnectAttempts } = get();
        
        if (reconnectAttempts < maxReconnectAttempts) {
          set({ 
            wsStatus: 'reconnecting',
            reconnectAttempts: reconnectAttempts + 1 
          });
          
          // Exponential backoff with jitter
          const baseDelay = 1000; // 1 second
          const maxDelay = 30000; // 30 seconds
          const jitter = Math.random() * 1000; // 0-1 second jitter
          const delay = Math.min(
            baseDelay * Math.pow(2, reconnectAttempts) + jitter, 
            maxDelay
          );
          
          get().addTerminalLine({ 
            type: 'system', 
            text: `Reconnecting in ${Math.round(delay / 1000)} seconds... (${reconnectAttempts + 1}/${maxReconnectAttempts})` 
          });
          
          setTimeout(() => {
            if (get().isAuthenticated && get().autoReconnect) {
              get().connectWebSocket();
            }
          }, delay);
        } else {
          get().addTerminalLine({ 
            type: 'error', 
            text: '❌ Max reconnection attempts reached. Please reconnect manually.' 
          });
          set({ wsStatus: 'disconnected' });
        }
      }
    };
  },

  disconnectWebSocket: () => {
    const { ws, heartbeatInterval } = get();
    
    // Clear heartbeat
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      set({ heartbeatInterval: null });
    }
    
    // Disable auto-reconnect temporarily
    set({ autoReconnect: false });
    
    if (ws) {
      ws.close(1000, 'Manual disconnect'); // Clean close
    }
    
    set({ 
      ws: null, 
      wsStatus: 'disconnected',
      autoReconnect: true // Re-enable auto-reconnect
    });
  },

  sendCommand: (command) => {
    const { ws, wsStatus } = get();
    
    if (!ws || wsStatus !== 'connected') {
      get().addTerminalLine({ 
        type: 'error', 
        text: '❌ Not connected to server. Please check connection.' 
      });
      return;
    }

    get().addTerminalLine({ type: 'command', text: `> ${command}` });
    
    try {
      ws.send(JSON.stringify({ type: 'command', text: command }));
    } catch (error) {
      get().addTerminalLine({ 
        type: 'error', 
        text: '❌ Failed to send command' 
      });
    }
  },

  setAutoReconnect: (enabled) => set({ autoReconnect: enabled }),

  resetReconnectAttempts: () => set({ reconnectAttempts: 0 })
}));