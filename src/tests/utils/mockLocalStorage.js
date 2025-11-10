/**
 * Mock localStorage/sessionStorage helpers for testing auth flow
 * 
 * Token storage key detected in repo: 'token' (used in both sessionStorage and localStorage)
 */

export const mockLocalStorage = {
  /**
   * Set auth token in storage (mimics login)
   * @param {string} token - JWT token
   * @param {object} options - Storage options
   */
  setToken(token = 'mock-jwt-token', options = {}) {
    const { useSession = true, refreshToken = 'mock-refresh-token' } = options;
    
    const storage = useSession ? sessionStorage : localStorage;
    storage.setItem('token', token);
    
    if (refreshToken) {
      storage.setItem('refreshToken', refreshToken);
    }
  },

  /**
   * Clear all auth tokens (mimics logout)
   */
  clearTokens() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },

  /**
   * Get current token from storage
   * @returns {string|null}
   */
  getToken() {
    return sessionStorage.getItem('token') || localStorage.getItem('token');
  },

  /**
   * Set user data in zustand persist storage
   * @param {object} user - User object { user_id, email, full_name, role }
   */
  setAuthState(user) {
    const authState = {
      state: {
        user,
        isAuthenticated: true,
        loading: false,
        error: null,
      },
      version: 0,
    };
    sessionStorage.setItem('skaev-auth-storage', JSON.stringify(authState));
  },

  /**
   * Clear auth state from zustand persist
   */
  clearAuthState() {
    sessionStorage.removeItem('skaev-auth-storage');
    localStorage.removeItem('skaev-auth-storage');
  },
};
