/**
 * Token Blacklist Service
 * 
 * Stores blacklisted tokens in memory (for production, use Redis)
 * Format: Map<token, expiryTimestamp>
 */

class TokenBlacklist {
  constructor() {
    this.blacklist = new Map();
    // Clean up expired tokens every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Add token to blacklist
   * @param {string} token - JWT token
   * @param {number} expiryTime - Token expiry timestamp in seconds
   */
  add(token, expiryTime) {
    // Store with expiry time (convert seconds to milliseconds)
    this.blacklist.set(token, expiryTime * 1000);
  }

  /**
   * Check if token is blacklisted
   * @param {string} token - JWT token
   * @returns {boolean} - True if token is blacklisted
   */
  isBlacklisted(token) {
    const expiry = this.blacklist.get(token);
    if (!expiry) {
      return false;
    }

    // If token has expired, remove it and return false
    if (Date.now() > expiry) {
      this.blacklist.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Remove token from blacklist
   * @param {string} token - JWT token
   */
  remove(token) {
    this.blacklist.delete(token);
  }

  /**
   * Clean up expired tokens
   */
  cleanup() {
    const now = Date.now();
    for (const [token, expiry] of this.blacklist.entries()) {
      if (now > expiry) {
        this.blacklist.delete(token);
      }
    }
  }

  /**
   * Clear all tokens (useful for testing)
   */
  clear() {
    this.blacklist.clear();
  }

  /**
   * Get blacklist size (for monitoring)
   * @returns {number} - Number of blacklisted tokens
   */
  size() {
    return this.blacklist.size;
  }

  /**
   * Stop cleanup interval (call this on app shutdown)
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance
export const tokenBlacklist = new TokenBlacklist();

// For production, you might want to use Redis instead:
/*
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export const tokenBlacklist = {
  add: async (token, expiryTime) => {
    await redis.setex(`blacklist:${token}`, expiryTime, '1');
  },
  isBlacklisted: async (token) => {
    const result = await redis.get(`blacklist:${token}`);
    return result === '1';
  },
  remove: async (token) => {
    await redis.del(`blacklist:${token}`);
  },
};
*/

