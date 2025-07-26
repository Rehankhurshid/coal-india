import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import { parse } from 'url'

interface ConnectedUser {
  ws: WebSocket
  userId: string
  lastSeen: number
  isOnline: boolean
}

interface WebSocketMessage {
  type: 'chat' | 'typing' | 'presence' | 'reaction' | 'error' | 'heartbeat'
  payload: any
  userId?: string
  conversationId?: string
  timestamp?: number
}

export class MessagingWebSocketServer {
  private wss: WebSocketServer
  private server: ReturnType<typeof createServer>
  private connectedUsers = new Map<string, ConnectedUser>()
  private conversationMembers = new Map<string, Set<string>>() // conversationId -> userIds
  private port: number

  constructor(port: number = 3002) {
    this.port = port
    this.server = createServer()
    this.wss = new WebSocketServer({ 
      server: this.server,
      path: '/'
    })

    this.setupWebSocketServer()
  }

  /**
   * Start the WebSocket server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (err?: Error) => {
        if (err) {
          reject(err)
        } else {
          console.log(`🚀 WebSocket server running on port ${this.port}`)
          resolve()
        }
      })
    })
  }

  /**
   * Stop the WebSocket server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.close(() => {
        this.server.close(() => {
          console.log('🛑 WebSocket server stopped')
          resolve()
        })
      })
    })
  }

  /**
   * Setup WebSocket server event handlers
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const { query } = parse(request.url || '', true)
      const userId = query.userId as string

      if (!userId) {
        console.warn('🔌 Connection rejected: no userId provided')
        ws.close(1008, 'userId required')
        return
      }

      console.log(`🔌 User connected: ${userId}`)

      // Store connected user
      this.connectedUsers.set(userId, {
        ws,
        userId,
        lastSeen: Date.now(),
        isOnline: true
      })

      // Send welcome message
      this.sendToUser(userId, {
        type: 'presence',
        payload: {
          message: 'Connected to messaging server',
          onlineUsers: this.getOnlineUserIds()
        }
      })

      // Broadcast presence update
      this.broadcastPresenceUpdate(userId, true)

      // Setup message handlers
      ws.on('message', (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString())
          this.handleMessage(userId, message)
        } catch (error) {
          console.error('📥 Failed to parse message:', error)
          this.sendError(userId, 'Invalid message format')
        }
      })

      // Handle disconnection
      ws.on('close', () => {
        console.log(`🔌 User disconnected: ${userId}`)
        this.handleUserDisconnect(userId)
      })

      // Handle errors
      ws.on('error', (error) => {
        console.error(`🔌 WebSocket error for user ${userId}:`, error)
      })

      // Update last seen
      ws.on('pong', () => {
        const user = this.connectedUsers.get(userId)
        if (user) {
          user.lastSeen = Date.now()
        }
      })
    })

    // Start heartbeat interval
    setInterval(() => {
      this.sendHeartbeat()
    }, 30000) // 30 seconds

    console.log('🔌 WebSocket server setup complete')
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(userId: string, message: WebSocketMessage): void {
    console.log(`📥 Received ${message.type} from ${userId}`)

    switch (message.type) {
      case 'chat':
        this.handleChatMessage(userId, message)
        break
      case 'typing':
        this.handleTypingIndicator(userId, message)
        break
      case 'presence':
        this.handlePresenceUpdate(userId, message)
        break
      case 'reaction':
        this.handleMessageReaction(userId, message)
        break
      case 'heartbeat':
        this.handleHeartbeat(userId, message)
        break
      default:
        console.warn(`📥 Unknown message type: ${message.type}`)
    }
  }

  /**
   * Handle chat messages
   */
  private handleChatMessage(userId: string, message: WebSocketMessage): void {
    const { conversationId, content } = message.payload

    if (!conversationId || !content) {
      this.sendError(userId, 'Invalid chat message: missing conversationId or content')
      return
    }

    // Broadcast to conversation members
    this.broadcastToConversation(conversationId, {
      type: 'chat',
      payload: {
        ...message.payload,
        senderId: userId,
        timestamp: Date.now()
      },
      conversationId
    }, userId) // Exclude sender
  }

  /**
   * Handle typing indicators
   */
  private handleTypingIndicator(userId: string, message: WebSocketMessage): void {
    const { conversationId, isTyping } = message.payload

    if (!conversationId) {
      this.sendError(userId, 'Invalid typing indicator: missing conversationId')
      return
    }

    // Broadcast to conversation members
    this.broadcastToConversation(conversationId, {
      type: 'typing',
      payload: {
        userId,
        conversationId,
        isTyping,
        timestamp: Date.now()
      },
      conversationId
    }, userId) // Exclude sender
  }

  /**
   * Handle presence updates
   */
  private handlePresenceUpdate(userId: string, message: WebSocketMessage): void {
    const user = this.connectedUsers.get(userId)
    if (user) {
      user.isOnline = message.payload.isOnline ?? true
      user.lastSeen = Date.now()
    }

    // Broadcast presence update
    this.broadcastPresenceUpdate(userId, message.payload.isOnline ?? true)
  }

  /**
   * Handle message reactions
   */
  private handleMessageReaction(userId: string, message: WebSocketMessage): void {
    const { conversationId, messageId, emoji, action } = message.payload

    if (!conversationId || !messageId || !emoji || !action) {
      this.sendError(userId, 'Invalid reaction: missing required fields')
      return
    }

    // Broadcast to conversation members
    this.broadcastToConversation(conversationId, {
      type: 'reaction',
      payload: {
        messageId,
        emoji,
        action, // 'add' or 'remove'
        userId,
        timestamp: Date.now()
      },
      conversationId
    })
  }

  /**
   * Handle heartbeat
   */
  private handleHeartbeat(userId: string, message: WebSocketMessage): void {
    const user = this.connectedUsers.get(userId)
    if (user) {
      user.lastSeen = Date.now()
    }

    // Send pong response
    this.sendToUser(userId, {
      type: 'heartbeat',
      payload: { pong: true }
    })
  }

  /**
   * Send message to specific user
   */
  private sendToUser(userId: string, message: WebSocketMessage): void {
    const user = this.connectedUsers.get(userId)
    if (user && user.ws.readyState === WebSocket.OPEN) {
      try {
        user.ws.send(JSON.stringify(message))
        console.log(`📤 Sent ${message.type} to ${userId}`)
      } catch (error) {
        console.error(`📤 Failed to send message to ${userId}:`, error)
      }
    }
  }

  /**
   * Broadcast message to conversation members
   */
  private broadcastToConversation(
    conversationId: string, 
    message: WebSocketMessage, 
    excludeUserId?: string
  ): void {
    // In a real implementation, you'd fetch conversation members from database
    // For now, we'll broadcast to all connected users except the sender
    this.connectedUsers.forEach((user, userId) => {
      if (userId !== excludeUserId && user.ws.readyState === WebSocket.OPEN) {
        try {
          user.ws.send(JSON.stringify(message))
        } catch (error) {
          console.error(`📤 Failed to broadcast to ${userId}:`, error)
        }
      }
    })
  }

  /**
   * Broadcast presence update
   */
  private broadcastPresenceUpdate(userId: string, isOnline: boolean): void {
    const presenceMessage: WebSocketMessage = {
      type: 'presence',
      payload: {
        userId,
        isOnline,
        timestamp: Date.now()
      }
    }

    this.connectedUsers.forEach((user, connectedUserId) => {
      if (connectedUserId !== userId && user.ws.readyState === WebSocket.OPEN) {
        try {
          user.ws.send(JSON.stringify(presenceMessage))
        } catch (error) {
          console.error(`📤 Failed to send presence update to ${connectedUserId}:`, error)
        }
      }
    })
  }

  /**
   * Send error message to user
   */
  private sendError(userId: string, errorMessage: string): void {
    this.sendToUser(userId, {
      type: 'error',
      payload: {
        message: errorMessage,
        timestamp: Date.now()
      }
    })
  }

  /**
   * Handle user disconnection
   */
  private handleUserDisconnect(userId: string): void {
    this.connectedUsers.delete(userId)
    this.broadcastPresenceUpdate(userId, false)
  }

  /**
   * Send heartbeat to all connected users
   */
  private sendHeartbeat(): void {
    const heartbeatMessage: WebSocketMessage = {
      type: 'heartbeat',
      payload: { ping: true }
    }

    this.connectedUsers.forEach((user, userId) => {
      if (user.ws.readyState === WebSocket.OPEN) {
        try {
          user.ws.ping()
        } catch (error) {
          console.error(`💓 Failed to ping ${userId}:`, error)
          this.handleUserDisconnect(userId)
        }
      } else {
        this.handleUserDisconnect(userId)
      }
    })
  }

  /**
   * Get list of online user IDs
   */
  private getOnlineUserIds(): string[] {
    return Array.from(this.connectedUsers.keys())
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      onlineUsers: Array.from(this.connectedUsers.values()).filter(u => u.isOnline).length
    }
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new MessagingWebSocketServer()
  
  server.start().then(() => {
    console.log('🚀 Messaging WebSocket server started successfully')
  }).catch((error) => {
    console.error('❌ Failed to start WebSocket server:', error)
    process.exit(1)
  })

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...')
    await server.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
    await server.stop()
    process.exit(0)
  })
}
