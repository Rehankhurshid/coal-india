import { Message, Group } from '@/types/messaging'

interface PendingMessage {
  id: string
  content: string
  conversationId: string
  userId: string
  timestamp: number
  retryCount: number
  status: 'pending' | 'failed' | 'sent'
}

interface CachedData {
  messages: Record<string, Message[]> // conversationId -> messages
  groups: Group[]
  lastSync: number
  pendingMessages: PendingMessage[]
}

export class OfflineSyncManager {
  private dbName = 'messaging-offline-db'
  private dbVersion = 1
  private db: IDBDatabase | null = null
  private isOnline = navigator.onLine
  private syncInterval: number | null = null

  constructor() {
    this.setupOnlineDetection()
    this.initializeDB()
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ IndexedDB initialized successfully')
        this.startSyncInterval()
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: 'id' })
          messagesStore.createIndex('conversationId', 'conversationId', { unique: false })
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains('groups')) {
          db.createObjectStore('groups', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('pendingMessages')) {
          const pendingStore = db.createObjectStore('pendingMessages', { keyPath: 'id' })
          pendingStore.createIndex('status', 'status', { unique: false })
          pendingStore.createIndex('conversationId', 'conversationId', { unique: false })
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }

        console.log('🔧 IndexedDB schema created/updated')
      }
    })
  }

  /**
   * Setup online/offline detection
   */
  private setupOnlineDetection(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored')
      this.isOnline = true
      this.syncPendingMessages()
    })

    window.addEventListener('offline', () => {
      console.log('📴 Connection lost')
      this.isOnline = false
    })
  }

  /**
   * Start background sync interval
   */
  private startSyncInterval(): void {
    // Sync every 30 seconds when online
    this.syncInterval = window.setInterval(() => {
      if (this.isOnline) {
        this.syncPendingMessages()
      }
    }, 30000)
  }

  /**
   * Stop sync interval
   */
  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Cache messages for a conversation
   */
  async cacheMessages(conversationId: string, messages: Message[]): Promise<void> {
    if (!this.db) {
      console.warn('⚠️ IndexedDB not initialized')
      return
    }

    const transaction = this.db.transaction(['messages'], 'readwrite')
    const store = transaction.objectStore('messages')

    // Clear existing messages for this conversation
    const index = store.index('conversationId')
    const range = IDBKeyRange.only(conversationId)
    
    try {
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = index.openCursor(range)
        
        deleteRequest.onsuccess = () => {
          const cursor = deleteRequest.result
          if (cursor) {
            cursor.delete()
            cursor.continue()
          } else {
            resolve()
          }
        }
        
        deleteRequest.onerror = () => reject(deleteRequest.error)
      })

      // Add new messages
      for (const message of messages) {
        await new Promise<void>((resolve, reject) => {
          const addRequest = store.add(message)
          addRequest.onsuccess = () => resolve()
          addRequest.onerror = () => reject(addRequest.error)
        })
      }

      console.log(`💾 Cached ${messages.length} messages for conversation ${conversationId}`)
    } catch (error) {
      console.error('❌ Failed to cache messages:', error)
    }
  }

  /**
   * Get cached messages for a conversation
   */
  async getCachedMessages(conversationId: string): Promise<Message[]> {
    if (!this.db) {
      console.warn('⚠️ IndexedDB not initialized')
      return []
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['messages'], 'readonly')
      const store = transaction.objectStore('messages')
      const index = store.index('conversationId')
      const range = IDBKeyRange.only(conversationId)
      const request = index.getAll(range)

      request.onsuccess = () => {
        const messages = request.result.sort((a, b) => a.timestamp - b.timestamp)
        console.log(`📥 Retrieved ${messages.length} cached messages for conversation ${conversationId}`)
        resolve(messages)
      }

      request.onerror = () => {
        console.error('❌ Failed to get cached messages:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Cache groups
   */
  async cacheGroups(groups: Group[]): Promise<void> {
    if (!this.db) {
      console.warn('⚠️ IndexedDB not initialized')
      return
    }

    const transaction = this.db.transaction(['groups'], 'readwrite')
    const store = transaction.objectStore('groups')

    try {
      // Clear existing groups
      await new Promise<void>((resolve, reject) => {
        const clearRequest = store.clear()
        clearRequest.onsuccess = () => resolve()
        clearRequest.onerror = () => reject(clearRequest.error)
      })

      // Add new groups
      for (const group of groups) {
        await new Promise<void>((resolve, reject) => {
          const addRequest = store.add(group)
          addRequest.onsuccess = () => resolve()
          addRequest.onerror = () => reject(addRequest.error)
        })
      }

      console.log(`💾 Cached ${groups.length} groups`)
    } catch (error) {
      console.error('❌ Failed to cache groups:', error)
    }
  }

  /**
   * Get cached groups
   */
  async getCachedGroups(): Promise<Group[]> {
    if (!this.db) {
      console.warn('⚠️ IndexedDB not initialized')
      return []
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['groups'], 'readonly')
      const store = transaction.objectStore('groups')
      const request = store.getAll()

      request.onsuccess = () => {
        console.log(`📥 Retrieved ${request.result.length} cached groups`)
        resolve(request.result)
      }

      request.onerror = () => {
        console.error('❌ Failed to get cached groups:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Queue message for sending when online
   */
  async queueMessage(message: Omit<PendingMessage, 'id' | 'retryCount' | 'status'>): Promise<string> {
    if (!this.db) {
      console.warn('⚠️ IndexedDB not initialized')
      return ''
    }

    const pendingMessage: PendingMessage = {
      ...message,
      id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0,
      status: 'pending'
    }

    const transaction = this.db.transaction(['pendingMessages'], 'readwrite')
    const store = transaction.objectStore('pendingMessages')

    return new Promise((resolve, reject) => {
      const request = store.add(pendingMessage)
      
      request.onsuccess = () => {
        console.log(`📝 Queued message for offline sync: ${pendingMessage.id}`)
        resolve(pendingMessage.id)
      }
      
      request.onerror = () => {
        console.error('❌ Failed to queue message:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Get pending messages
   */
  async getPendingMessages(): Promise<PendingMessage[]> {
    if (!this.db) {
      console.warn('⚠️ IndexedDB not initialized')
      return []
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingMessages'], 'readonly')
      const store = transaction.objectStore('pendingMessages')
      const index = store.index('status')
      const range = IDBKeyRange.only('pending')
      const request = index.getAll(range)

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        console.error('❌ Failed to get pending messages:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Mark message as sent
   */
  async markMessageSent(messageId: string): Promise<void> {
    if (!this.db) {
      console.warn('⚠️ IndexedDB not initialized')
      return
    }

    const transaction = this.db.transaction(['pendingMessages'], 'readwrite')
    const store = transaction.objectStore('pendingMessages')

    return new Promise((resolve, reject) => {
      const getRequest = store.get(messageId)
      
      getRequest.onsuccess = () => {
        const message = getRequest.result
        if (message) {
          message.status = 'sent'
          const updateRequest = store.put(message)
          
          updateRequest.onsuccess = () => {
            console.log(`✅ Message marked as sent: ${messageId}`)
            resolve()
          }
          
          updateRequest.onerror = () => {
            console.error('❌ Failed to update message status:', updateRequest.error)
            reject(updateRequest.error)
          }
        } else {
          resolve() // Message not found, already processed
        }
      }
      
      getRequest.onerror = () => {
        console.error('❌ Failed to get message for update:', getRequest.error)
        reject(getRequest.error)
      }
    })
  }

  /**
   * Mark message as failed
   */
  async markMessageFailed(messageId: string): Promise<void> {
    if (!this.db) {
      console.warn('⚠️ IndexedDB not initialized')
      return
    }

    const transaction = this.db.transaction(['pendingMessages'], 'readwrite')
    const store = transaction.objectStore('pendingMessages')

    return new Promise((resolve, reject) => {
      const getRequest = store.get(messageId)
      
      getRequest.onsuccess = () => {
        const message = getRequest.result
        if (message) {
          message.status = 'failed'
          message.retryCount += 1
          const updateRequest = store.put(message)
          
          updateRequest.onsuccess = () => {
            console.log(`❌ Message marked as failed: ${messageId} (retry ${message.retryCount})`)
            resolve()
          }
          
          updateRequest.onerror = () => {
            console.error('❌ Failed to update message status:', updateRequest.error)
            reject(updateRequest.error)
          }
        } else {
          resolve() // Message not found
        }
      }
      
      getRequest.onerror = () => {
        console.error('❌ Failed to get message for update:', getRequest.error)
        reject(getRequest.error)
      }
    })
  }

  /**
   * Sync pending messages when online
   */
  async syncPendingMessages(): Promise<void> {
    if (!this.isOnline) {
      console.log('📴 Offline - skipping message sync')
      return
    }

    const pendingMessages = await this.getPendingMessages()
    
    if (pendingMessages.length === 0) {
      return
    }

    console.log(`🔄 Syncing ${pendingMessages.length} pending messages`)

    for (const message of pendingMessages) {
      // Skip messages that have failed too many times
      if (message.retryCount >= 3) {
        console.warn(`⚠️ Skipping message ${message.id} - too many retries`)
        continue
      }

      try {
        // Send message to API
        const response = await fetch(`/api/messaging/groups/${message.conversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: message.content,
            userId: message.userId
          })
        })

        if (response.ok) {
          await this.markMessageSent(message.id)
          console.log(`✅ Successfully synced message: ${message.id}`)
        } else {
          await this.markMessageFailed(message.id)
          console.error(`❌ Failed to sync message ${message.id}:`, response.statusText)
        }
      } catch (error) {
        await this.markMessageFailed(message.id)
        console.error(`❌ Failed to sync message ${message.id}:`, error)
      }
    }
  }

  /**
   * Clear old data
   */
  async clearOldData(daysOld: number = 7): Promise<void> {
    if (!this.db) {
      console.warn('⚠️ IndexedDB not initialized')
      return
    }

    const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000)

    // Clear old messages
    const messageTransaction = this.db.transaction(['messages'], 'readwrite')
    const messageStore = messageTransaction.objectStore('messages')
    const messageIndex = messageStore.index('timestamp')
    const messageRange = IDBKeyRange.upperBound(cutoffDate)

    const messageRequest = messageIndex.openCursor(messageRange)
    let deletedMessages = 0

    messageRequest.onsuccess = () => {
      const cursor = messageRequest.result
      if (cursor) {
        cursor.delete()
        deletedMessages++
        cursor.continue()
      } else {
        console.log(`🗑️ Deleted ${deletedMessages} old messages`)
      }
    }

    // Clear sent pending messages
    const pendingTransaction = this.db.transaction(['pendingMessages'], 'readwrite')
    const pendingStore = pendingTransaction.objectStore('pendingMessages')
    const sentIndex = pendingStore.index('status')
    const sentRange = IDBKeyRange.only('sent')

    const sentRequest = sentIndex.openCursor(sentRange)
    let deletedPending = 0

    sentRequest.onsuccess = () => {
      const cursor = sentRequest.result
      if (cursor) {
        cursor.delete()
        deletedPending++
        cursor.continue()
      } else {
        console.log(`🗑️ Deleted ${deletedPending} sent pending messages`)
      }
    }
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      dbInitialized: this.db !== null,
      syncRunning: this.syncInterval !== null
    }
  }

  /**
   * Cleanup and close connections
   */
  cleanup(): void {
    this.stopSync()
    
    if (this.db) {
      this.db.close()
      this.db = null
    }

    window.removeEventListener('online', this.setupOnlineDetection)
    window.removeEventListener('offline', this.setupOnlineDetection)
  }
}

// Create singleton instance
export const offlineSyncManager = new OfflineSyncManager()
