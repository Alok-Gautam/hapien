/**
 * IndexedDB-based session storage for enhanced persistence
 * Especially useful for iOS PWAs where localStorage may be cleared after 7 days
 */

const DB_NAME = 'hapien-auth-db'
const STORE_NAME = 'auth-sessions'
const DB_VERSION = 1
const SESSION_KEY = 'current-session'

interface StoredSession {
  access_token: string
  refresh_token: string
  expires_at: number
  user_id: string
  timestamp: number
}

class SessionStorage {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  private async initDB(): Promise<void> {
    if (this.db) return
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not available'))
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('[SessionStorage] Failed to open DB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('[SessionStorage] DB opened successfully')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
          objectStore.createIndex('timestamp', 'timestamp', { unique: false })
          console.log('[SessionStorage] Object store created')
        }
      }
    })

    return this.initPromise
  }

  async saveSession(session: {
    access_token: string
    refresh_token: string
    expires_at: number
    user?: { id: string }
  }): Promise<void> {
    try {
      await this.initDB()
      if (!this.db) throw new Error('DB not initialized')

      const storedSession: StoredSession = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user_id: session.user?.id || '',
        timestamp: Date.now(),
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.put({ key: SESSION_KEY, ...storedSession })

        request.onsuccess = () => {
          console.log('[SessionStorage] Session saved to IndexedDB')
          resolve()
        }

        request.onerror = () => {
          console.error('[SessionStorage] Failed to save session:', request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error('[SessionStorage] Error in saveSession:', error)
      // Don't throw - storage is optional
    }
  }

  async getSession(): Promise<StoredSession | null> {
    try {
      await this.initDB()
      if (!this.db) return null

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(SESSION_KEY)

        request.onsuccess = () => {
          const result = request.result
          if (result) {
            const session = result as { key: string } & StoredSession

            // Check if session is expired
            if (session.expires_at && session.expires_at < Date.now() / 1000) {
              console.log('[SessionStorage] Session expired, clearing')
              this.clearSession()
              resolve(null)
              return
            }

            // Check if session is too old (> 30 days)
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
            if (session.timestamp < thirtyDaysAgo) {
              console.log('[SessionStorage] Session too old, clearing')
              this.clearSession()
              resolve(null)
              return
            }

            console.log('[SessionStorage] Session retrieved from IndexedDB')
            resolve(session)
          } else {
            resolve(null)
          }
        }

        request.onerror = () => {
          console.error('[SessionStorage] Failed to get session:', request.error)
          resolve(null) // Don't reject - just return null
        }
      })
    } catch (error) {
      console.error('[SessionStorage] Error in getSession:', error)
      return null
    }
  }

  async clearSession(): Promise<void> {
    try {
      await this.initDB()
      if (!this.db) return

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(SESSION_KEY)

        request.onsuccess = () => {
          console.log('[SessionStorage] Session cleared from IndexedDB')
          resolve()
        }

        request.onerror = () => {
          console.error('[SessionStorage] Failed to clear session:', request.error)
          resolve() // Don't reject - clearing is optional
        }
      })
    } catch (error) {
      console.error('[SessionStorage] Error in clearSession:', error)
      // Don't throw - clearing is optional
    }
  }

  async hasSession(): Promise<boolean> {
    const session = await this.getSession()
    return session !== null
  }
}

/**
 * Multi-storage session manager that uses both IndexedDB and localStorage
 * for redundancy. Increases survival rate across iOS PWA restarts.
 */
class MultiStorageSession {
  private indexedDBStorage = new SessionStorage()

  async saveSession(session: {
    access_token: string
    refresh_token: string
    expires_at: number
    user?: { id: string }
  }): Promise<void> {
    // Save to IndexedDB (primary)
    await this.indexedDBStorage.saveSession(session)

    // Also save to localStorage as backup
    try {
      const sessionData = JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user_id: session.user?.id || '',
        timestamp: Date.now(),
      })
      localStorage.setItem('hapien-auth-backup', sessionData)
      console.log('[MultiStorage] ✅ Saved to localStorage backup')
    } catch (error) {
      console.error('[MultiStorage] ❌ localStorage save failed:', error)
    }
  }

  async getSession(): Promise<StoredSession | null> {
    // Try IndexedDB first (primary)
    try {
      const indexedSession = await this.indexedDBStorage.getSession()
      if (indexedSession) {
        console.log('[MultiStorage] ✅ Retrieved from IndexedDB')
        return indexedSession
      }
    } catch (error) {
      console.error('[MultiStorage] ❌ IndexedDB retrieval failed:', error)
    }

    // Fall back to localStorage
    try {
      const localData = localStorage.getItem('hapien-auth-backup')
      if (localData) {
        const session = JSON.parse(localData) as StoredSession

        // Validate expiry
        if (session.expires_at && session.expires_at < Date.now() / 1000) {
          console.log('[MultiStorage] localStorage session expired')
          this.clearSession()
          return null
        }

        // Validate age (30 days max)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
        if (session.timestamp < thirtyDaysAgo) {
          console.log('[MultiStorage] localStorage session too old')
          this.clearSession()
          return null
        }

        console.log('[MultiStorage] ✅ Retrieved from localStorage backup')
        return session
      }
    } catch (error) {
      console.error('[MultiStorage] ❌ localStorage retrieval failed:', error)
    }

    return null
  }

  async clearSession(): Promise<void> {
    // Clear from both storage mechanisms
    await this.indexedDBStorage.clearSession()

    try {
      localStorage.removeItem('hapien-auth-backup')
      console.log('[MultiStorage] ✅ Cleared localStorage backup')
    } catch (error) {
      console.error('[MultiStorage] ❌ localStorage clear failed:', error)
    }
  }

  async hasSession(): Promise<boolean> {
    const session = await this.getSession()
    return session !== null
  }
}

// Export multi-storage singleton instance
export const sessionStorage = new MultiStorageSession()
