import { useCallback, useRef, useState } from 'react';

export interface WebSocketOptions {
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: (url: string) => void;
  disconnect: () => void;
  send: (data: unknown) => void;
}

export function useWebSocket(options: WebSocketOptions = {}): UseWebSocketReturn {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = false,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlRef = useRef<string | null>(null);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const attemptReconnect = useCallback(() => {
    if (
      !reconnect ||
      !urlRef.current ||
      reconnectAttemptsRef.current >= maxReconnectAttempts
    ) {
      return;
    }

    clearReconnectTimeout();
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      // Re-connect will be handled by connect function
      if (urlRef.current) {
        const url = urlRef.current;
        urlRef.current = null; // Temporarily clear to allow reconnect
        connect(url);
      }
    }, reconnectInterval);
  }, [reconnect, reconnectInterval, maxReconnectAttempts, clearReconnectTimeout]);

  const connect = useCallback(
    (url: string) => {
      // Clean up existing connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      clearReconnectTimeout();
      setConnecting(true);
      setError(null);
      urlRef.current = url;

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          setConnecting(false);
          setError(null);
          reconnectAttemptsRef.current = 0;
          onOpen?.();
        };

        ws.onclose = () => {
          setConnected(false);
          setConnecting(false);
          wsRef.current = null;
          onClose?.();
          attemptReconnect();
        };

        ws.onerror = (event) => {
          setError('WebSocket connection error');
          setConnecting(false);
          onError?.(event);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            onMessage?.(data);
          } catch {
            // If not JSON, pass as string
            onMessage?.(event.data);
          }
        };
      } catch (err) {
        setConnecting(false);
        setError(err instanceof Error ? err.message : 'Failed to connect');
      }
    },
    [onMessage, onOpen, onClose, onError, attemptReconnect, clearReconnectTimeout]
  );

  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    urlRef.current = null;
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent reconnect

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnected(false);
    setConnecting(false);
  }, [clearReconnectTimeout, maxReconnectAttempts]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      wsRef.current.send(message);
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }, []);

  return {
    connected,
    connecting,
    error,
    connect,
    disconnect,
    send,
  };
}

export default useWebSocket;
