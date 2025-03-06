import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useIsClient } from "~/hooks/useIsClient"; // Import your existing useIsClient hook

type WebSocketContextType = {
  sendMessage: (msg: string) => void;
  lastMessage: string | null;
  readyState: number;
  registerWsSubscription: (type: string, payload: any, unsubscribe?: boolean) => void;
};

enum WebSocketReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ url: string; children: React.ReactNode }> = ({ url, children }) => {
  const isClient = useIsClient(); // ✅ Prevents WebSocket from running on SSR
  const [message, setMessage] = useState<string | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocketReadyState.CLOSED);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelay = 3000; // Auto-reconnect delay

  const connectWebSocket = () => {
    if (!isClient) return; // ✅ Ensure WebSocket only runs on client side

    if (socketRef.current) {
      socketRef.current.close();
    }
 
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      setReadyState(WebSocketReadyState.OPEN);
    };

    socket.onmessage = (event) => {
      setMessage(event.data);
    };

    socket.onclose = () => {
      setReadyState(WebSocketReadyState.CLOSED);
      reconnectTimeout.current = setTimeout(connectWebSocket, reconnectDelay);
    };

    socket.onerror = (error) => {
      socket.close();
    };
  };

  useEffect(() => {
    if (isClient) {
      connectWebSocket();
    }
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      socketRef.current?.close();
    };
  }, [url, isClient]); // ✅ Only runs when client-side is ready

  const sendMessage = (msg: string) => {
    if (socketRef.current?.readyState === WebSocketReadyState.OPEN) {
      socketRef.current.send(msg);
    }
  };
  

  const registerWsSubscription = (type: string, payload: any, unsubscribe: boolean = false) => {
        sendMessage(JSON.stringify(
          {method: unsubscribe ? "unsubscribe" : "subscribe", 
            subscription: 
            {
              type: type,
              ...payload
            }}  
        ))
  };

  return (
    <WebSocketContext.Provider value={{ sendMessage, lastMessage: message, readyState, registerWsSubscription}}>
      {children} 
    </WebSocketContext.Provider>
    
  );
};

// Custom Hook to use WebSocket Context
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider");
  }
  return context;
};
