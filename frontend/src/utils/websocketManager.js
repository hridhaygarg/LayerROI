export class WebSocketManager {
  constructor(url) {
    this.url = url || process.env.REACT_APP_WS_URL;
    if (!this.url) {
      console.error('WebSocket URL is required. Set REACT_APP_WS_URL environment variable or pass URL to constructor');
    }
    this.ws = null;
    this.listeners = {};
    this.heartbeatInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.connectionPromise = null;
    this.connectionResolve = null;
    this.connectionReject = null;
  }

  connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.connectionResolve = resolve;
      this.connectionReject = reject;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.connectionResolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.connectionReject(error);
        };

        this.ws.onclose = () => {
          this.ws = null;
          this.stopHeartbeat();
          this.attemptReconnect();
        };
      } catch (error) {
        this.connectionReject(error);
      }
    });

    return this.connectionPromise;
  }

  handleMessage(message) {
    const { type, data } = message;
    if (type && this.listeners[type]) {
      this.listeners[type].forEach((callback) => {
        try {
          callback(message);
        } catch (error) {
          console.error(`Error in listener for event ${type}:`, error);
        }
      });
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
      if (this.listeners[event].length === 0) {
        delete this.listeners[event];
      }
    };
  }

  emit(event, data) {
    if (!this.ws || this.ws.readyState !== 1) {
      throw new Error('WebSocket is not connected');
    }

    const message = {
      type: event,
      data,
    };

    this.ws.send(JSON.stringify(message));
  }

  startHeartbeat() {
    if (this.heartbeatInterval) {
      return;
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === 1) {
        try {
          this.emit('ping', {});
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      }
    }, 30000); // 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    setTimeout(() => {
      if (!this.ws || this.ws.readyState !== 1) {
        this.connectionPromise = null;
        this.connect().catch((error) => {
          console.error('Reconnection attempt failed:', error);
        });
      }
    }, delay);
  }

  disconnect() {
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.listeners = {};
    this.connectionPromise = null;
  }
}
