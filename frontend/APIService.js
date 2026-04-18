// Frontend Integration Guide

/**
 * API Service Class untuk Frontend (React/Vue/Angular)
 * 
 * Usage:
 * const api = new APIService('http://localhost:5000');
 * const user = await api.register({ nama, email, password, ... });
 */

class APIService {
  constructor(baseURL = 'http://localhost:5000') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('sakuraMaharToken');
  }

  /**
   * Set auth token
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('sakuraMaharToken', token);
  }

  /**
   * Get auth token
   */
  getToken() {
    return this.token || localStorage.getItem('sakuraMaharToken');
  }

  /**
   * Remove auth token
   */
  removeToken() {
    this.token = null;
    localStorage.removeItem('sakuraMaharToken');
  }

  /**
   * Make API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ===== AUTH ENDPOINTS =====

  async register(data) {
    const response = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (response.token) this.setToken(response.token);
    return response;
  }

  async login(email, password) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (response.token) this.setToken(response.token);
    return response;
  }

  async verifyToken(token) {
    return this.request('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  // ===== USER ENDPOINTS =====

  async getUserProfile() {
    return this.request('/api/users/profile');
  }

  async updateProfile(data) {
    return this.request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // ===== MAHAR ENDPOINTS =====

  async createMahar(data) {
    return this.request('/api/mahar/create', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getMahar(id) {
    return this.request(`/api/mahar/${id}`);
  }

  async getAllMahars() {
    return this.request('/api/mahar');
  }

  async recordPembayaran(maharId, data) {
    return this.request(`/api/mahar/${maharId}/bayar`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ===== GUEST ENDPOINTS =====

  async addGuest(data) {
    return this.request('/api/guests/add', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getGuestList() {
    return this.request('/api/guests/list');
  }

  async updateGuestStatus(guestId, data) {
    return this.request(`/api/guests/${guestId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteGuest(guestId) {
    return this.request(`/api/guests/${guestId}`, {
      method: 'DELETE'
    });
  }

  // ===== UNDANGAN ENDPOINTS =====

  async sendUndangan(data) {
    return this.request('/api/undangan/send', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getUndanganList() {
    return this.request('/api/undangan/list');
  }

  async getUndangan(code) {
    return this.request(`/api/undangan/${code}`);
  }

  async submitRSVP(code, data) {
    return this.request(`/api/undangan/rsvp/${code}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ===== CONTACT ENDPOINTS =====

  async sendContact(data) {
    return this.request('/api/contact/send', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getMessages() {
    return this.request('/api/contact');
  }

  async getMessage(id) {
    return this.request(`/api/contact/${id}`);
  }

  async respondMessage(id, response) {
    return this.request(`/api/contact/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response })
    });
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIService;
}
