import { EventEmitter } from 'events'

export interface WebSocketMessage {
  type: 'chat' | 'typing' | 'presence' | 'reaction' | 'error' | 'heartbeat'
  payload: any
  userId?: string
  conversationId?: string
  timestamp?: number
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export class WebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectDelay = 2000
  private maxReconnectDelay = 30000
  private connectionTimeout: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private status: ConnectionStatus = 'disconnected'
  private userId: string | null = null

  constructor() {
    super()
  }

  /**
   * Connect to WebSocket server
   */
  async connect(userId: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('🔌 Already connected to WebSocket')
      return
    }

    this.userId = userId
    this.status = 'connecting'
    this.emit('statusChange', this.status)

    try {
      const wsUrl = this.getWebSocketUrl()
      const fullUrl = `${wsUrl}?userId=${encodeURIComponent(userId)}`
      
      console.log('🔌 Connecting to WebSocket:', fullUrl)

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.status === 'connecting') {
          console.warn('🔌 Connection timeout after 10 seconds')
          this.handleConnectionFailure()
        }
      }, 10000)

      this.ws = new WebSocket(fullUrl)
      this.setupEventListeners()

    } catch (error) {
      console.error('🔌 Failed to create WebSocket connection:', error)
      this.handleConnectionFailure()
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    console.log('🔌 Disconnecting WebSocket')
    
    this.cleanup()
    
    if (this.ws) {
      this.ws.close(1000, 'User requested disconnect')
      this.ws = null
    }
    
    this.status = 'disconnected'
    this.emit('statusChange', this.status)
  }

  /**
   * Send message to WebSocket server
   */
  sendMessage(message: WebSocketMessage): void {
    if (!this.isConnected()) {
      console.warn('🔌 Cannot send message: not connected')
      this.emit('error', new Error('WebSocket not connected'))
      return
    }

    try {
      const messageWithTimestamp = {
        ...message,
        timestamp: Date.now(),
        userId: this.userId
      }
      
      this.ws!.send(JSON.stringify(messageWithTimestamp))
      console.log('📤 Sent message:', messageWithTimestamp.type)
    } catch (error) {
      console.error('📤 Failed to send message:', error)
      this.emit('error', error)
    }
  }

  /**
   * Send chat message
   */
  sendChatMessage(content: string, conversationId: string, userId: string): void {
    this.sendMessage({
      type: 'chat',
      payload: {
        content,
        conversationId,
        userId
      },
      conversationId
    })
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, userId: string, isTyping: boolean): void {
    // Throttle typing indicators to reduce traffic
    this.sendMessage({
      type: 'typing',
      payload: {
        conversationId,
        userId,
        isTyping
      },
      conversationId
    })
  }

  /**
   * Send presence update
   */
  sendPresenceUpdate(isOnline: boolean): void {
    this.sendMessage({
      type: 'presence',
      payload: {
        userId: this.userId,
        isOnline,
        lastSeen: Date.now()
      }
    })
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status
  }

  /**
   * Get WebSocket URL based on environment
   */
  private getWebSocketUrl(): string {
    // Priority 1: Environment variable
    if (process.env.NEXT_PUBLIC_WEBSOCKET_URL) {
      return process.env.NEXT_PUBLIC_WEBSOCKET_URL
    }
    
    // Priority 2: Local development detection
    if (typeof window !== 'undefined') {
      const isLocalDev = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.includes('loca.lt')
      
      if (isLocalDev) {
        return `ws://localhost:3002`
      }
      
      // Priority 3: Production domains
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${protocol}//${window.location.hostname}:3002`
    }
    
    return 'ws://localhost:3002'
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('🔌 WebSocket connected')
      this.clearConnectionTimeout()
      this.status = 'connected'
      this.reconnectAttempts = 0
      this.reconnectDelay = 2000
      
      this.emit('statusChange', this.status)
      this.emit('connected')
      
      this.startHeartbeat()
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        console.log('📥 Received message:', message.type)
        this.emit('message', message)
        
        // Handle specific message types
        switch (message.type) {
          case 'heartbeat':
            // Respond to heartbeat
            this.sendMessage({ type: 'heartbeat', payload: { pong: true } })
            break
          case 'chat':
            this.emit('chatMessage', message)
            break
          case 'typing':
            this.emit('typingIndicator', message)
            break
          case 'presence':
            this.emit('presenceUpdate', message)
            break
          case 'reaction':
            this.emit('messageReaction', message)
            break
          case 'error':
            this.emit('serverError', message.payload)
            break
        }
      } catch (error) {
        console.error('📥 Failed to parse WebSocket message:', error)
      }
    }

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason)
      this.cleanup()
      
      if (event.code !== 1000) { // Not a normal closure
        this.handleConnectionFailure()
      } else {
        this.status = 'disconnected'
        this.emit('statusChange', this.status)
      }
    }

    this.ws.onerror = (error) => {
      console.error('🔌 WebSocket error:', error)
      this.status = 'error'
      this.emit('statusChange', this.status)
      this.emit('error', error)
    }
  }

  /**
   * Handle connection failure and attempt reconnection
   */
  private handleConnectionFailure(): void {
    this.cleanup()
    this.status = 'error'
    this.emit('statusChange', this.status)

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      
      console.log(`🔌 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`)
      
      setTimeout(() => {
        if (this.userId) {
          this.connect(this.userId)
        }
      }, this.reconnectDelay)

      // Exponential backoff with max delay
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay)
    } else {
      console.error('🔌 Max reconnection attempts reached')
      this.emit('maxReconnectAttemptsReached')
    }
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({ type: 'heartbeat', payload: { ping: true } })
      }
    }, 30000) // 30 seconds
  }

  /**
   * Clear connection timeout
   */
  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }
  }

  /**
   * Cleanup timers and connections
   */
  private cleanup(): void {
    this.clearConnectionTimeout()
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager()
