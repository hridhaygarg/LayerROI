import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { WebSocketManager } from '../utils/websocketManager';

export function useWebSocket() {
  const wsRef = useRef(null);
  const unsubscribesRef = useRef([]);
  const queryClient = useQueryClient();
  const wsUrlRef = useRef(null);

  useEffect(() => {
    // Get WebSocket URL from environment
    const wsUrl = process.env.REACT_APP_WS_URL;
    if (!wsUrl) {
      console.error('REACT_APP_WS_URL environment variable is required');
      return;
    }
    wsUrlRef.current = wsUrl;

    // Create WebSocketManager instance
    wsRef.current = new WebSocketManager(wsUrl);

    // Connect to WebSocket
    wsRef.current.connect().catch((error) => {
      console.error('Failed to connect to WebSocket:', error);
    });

    // Register event listeners for real-time updates
    const setupListeners = () => {
      const listeners = [
        {
          event: 'outreach.sent',
          handler: () => {
            queryClient.invalidateQueries({ queryKey: ['outreach'] });
            queryClient.invalidateQueries({ queryKey: ['queue'] });
          },
        },
        {
          event: 'outreach.opened',
          handler: () => {
            queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] });
          },
        },
        {
          event: 'outreach.clicked',
          handler: () => {
            queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] });
          },
        },
        {
          event: 'prospect.created',
          handler: () => {
            queryClient.invalidateQueries({ queryKey: ['prospects'] });
          },
        },
        {
          event: 'integration.synced',
          handler: () => {
            queryClient.invalidateQueries({ queryKey: ['integrations'] });
          },
        },
        {
          event: 'analytics.updated',
          handler: () => {
            queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] });
          },
        },
      ];

      listeners.forEach(({ event, handler }) => {
        const unsubscribe = wsRef.current.on(event, handler);
        unsubscribesRef.current.push(unsubscribe);
      });
    };

    setupListeners();

    // Start heartbeat to keep connection alive
    wsRef.current.startHeartbeat();

    // Cleanup on unmount
    return () => {
      // Unsubscribe all listeners
      unsubscribesRef.current.forEach((unsubscribe) => {
        unsubscribe();
      });
      unsubscribesRef.current = [];

      // Disconnect WebSocket
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [queryClient]);

  // Return ref with emit method for manual event emission
  return wsRef.current ? { emit: wsRef.current.emit.bind(wsRef.current) } : {};
}
