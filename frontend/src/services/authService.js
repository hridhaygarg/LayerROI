/**
 * Authentication Service
 * Handles all authentication operations with the backend API
 */

const API_URL = process.env.REACT_APP_API_URL || 'https://api.layeroi.com';
const STORAGE_KEYS = {
  TOKEN: 'layeroi_token',
  REFRESH_TOKEN: 'layeroi_refresh_token',
  USER: 'layeroi_user',
  ORG: 'layeroi_org',
};

class AuthService {
  constructor() {
    this.token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    this.user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
    this.org = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORG) || 'null');
    this.listeners = [];
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify listeners of state change
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener({
        isAuthenticated: !!this.token,
        user: this.user,
        org: this.org,
        token: this.token,
      });
    });
  }

  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      this.setToken(data.token);
      this.setUser(data.user);
      if (data.organisation) {
        this.setOrg(data.organisation);
      }

      return { success: true, user: data.user, org: data.organisation };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Sign up with email, name, and company
   */
  async signup(email, name, company) {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, company }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Signup failed');
      }

      const data = await response.json();
      this.setToken(data.token);
      this.setUser(data.user);
      this.setOrg(data.organisation);

      return {
        success: true,
        user: data.user,
        org: data.organisation,
        apiKey: data.apiKey,
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * Logout - clear all auth state
   */
  logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.ORG);
    this.token = null;
    this.user = null;
    this.org = null;
    this.notifyListeners();
  }

  /**
   * Set auth token in state and storage
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    this.notifyListeners();
  }

  /**
   * Set user in state and storage
   */
  setUser(user) {
    this.user = user;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    this.notifyListeners();
  }

  /**
   * Set org in state and storage
   */
  setOrg(org) {
    this.org = org;
    localStorage.setItem(STORAGE_KEYS.ORG, JSON.stringify(org));
    this.notifyListeners();
  }

  /**
   * Get current auth state
   */
  getState() {
    return {
      isAuthenticated: !!this.token,
      user: this.user,
      org: this.org,
      token: this.token,
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Get auth token for API requests
   */
  getToken() {
    return this.token;
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader() {
    if (!this.token) return {};
    return { Authorization: `Bearer ${this.token}` };
  }
}

// Singleton instance
export const authService = new AuthService();

export default authService;
