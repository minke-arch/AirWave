// In-Memory Lock Manager for local fallback (Simulates Redis Distributed Lock)
// In production, this can be swapped with Redis Redlock implementation.

interface LockInfo {
  userId: string;
  expiresAt: number;
}

class MemoryLockManager {
  private locks = new Map<string, LockInfo>();

  /**
   * Acquire a lock for a specific key.
   * @param key Unique key for the lock (e.g., "lock:showtime_id:seat_no")
   * @param userId ID of the user requesting the lock
   * @param ttlMs Time-to-live in milliseconds (default: 10 minutes)
   * @returns true if lock acquired successfully, false if already locked
   */
  public acquireLock(key: string, userId: string, ttlMs: number = 600000): boolean {
    const now = Date.now();
    const existingLock = this.locks.get(key);

    if (existingLock) {
      // If the lock has expired, clean it up and allow re-locking
      if (now > existingLock.expiresAt) {
        this.locks.delete(key);
      } else {
        // If locked by someone else, fail.
        // If locked by the same user, we can extend it (re-entrant).
        if (existingLock.userId !== userId) {
          return false;
        }
      }
    }

    // Set new lock
    this.locks.set(key, {
      userId,
      expiresAt: now + ttlMs,
    });

    return true;
  }

  /**
   * Release a lock.
   * @param key Lock key
   * @param userId User requesting release (only owner can release)
   * @returns true if released, false if not owner or not found
   */
  public releaseLock(key: string, userId: string): boolean {
    const existingLock = this.locks.get(key);

    if (!existingLock) {
      return true; // Already released or expired
    }

    if (existingLock.userId === userId) {
      this.locks.delete(key);
      return true;
    }

    return false; // Cannot release someone else's lock
  }

  /**
   * Optional: Clean up expired locks from memory to prevent memory leak.
   */
  public cleanupExpiredLocks(): void {
    const now = Date.now();
    for (const [key, lock] of this.locks.entries()) {
      if (now > lock.expiresAt) {
        this.locks.delete(key);
      }
    }
  }
}

// Global instance to maintain state across Hot-reloading in Next.js development mode
const globalForLock = globalThis as unknown as {
  lockManager: MemoryLockManager | undefined;
};

export const lockManager = globalForLock.lockManager ?? new MemoryLockManager();

if (process.env.NODE_ENV !== "production") {
  globalForLock.lockManager = lockManager;
}

// Cleanup routine every 1 minute
if (typeof window === "undefined") {
  setInterval(() => {
    lockManager.cleanupExpiredLocks();
  }, 60000);
}
