const API_BASE = '/api';

const getToken = () => localStorage.getItem('access_token');

const request = async (path: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const errorText = await response.text();
    const error: any = new Error(errorText || `Request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
};

export const authApi = {
  async login(email: string, password: string) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  async register(name: string, email: string, password: string) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },
  async me() {
    return request('/auth/me');
  },
};

export const usersApi = {
  async list() {
    return request('/users');
  },
  async create(payload: any) {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async update(id: string, payload: any) {
    return request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  async uploadAvatar(id: string, file: File) {
    const token = tokenStore.get();
    const form = new FormData();
    form.append('avatar', file);
    const response = await fetch(`/api/users/${id}/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    if (!response.ok) {
      const errorText = await response.text();
      const error: any = new Error(errorText || `Request failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return response.json();
  },
  async remove(id: string) {
    return request(`/users/${id}`, { method: 'DELETE' });
  },
};

export const servicesApi = {
  async list() {
    return request('/services');
  },
  async create(payload: any) {
    return request('/services', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async update(id: string, payload: any) {
    return request(`/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  async remove(id: string) {
    return request(`/services/${id}`, { method: 'DELETE' });
  },
  async getReviews(serviceId: string) {
    return request(`/services/${serviceId}/reviews`);
  },
  async getHistory(serviceId: string) {
    return request(`/services/${serviceId}/history`);
  },
};

export const reviewsApi = {
  async list() {
    return request('/reviews');
  },
  async create(payload: any) {
    return request('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async like(id: string) {
    return request(`/reviews/${id}/like`, { method: 'PATCH' });
  },
  async dislike(id: string) {
    return request(`/reviews/${id}/dislike`, { method: 'PATCH' });
  },
  async remove(id: string) {
    return request(`/reviews/${id}`, { method: 'DELETE' });
  },
};

export const ordersApi = {
  async list() {
    return request('/orders');
  },
  async create(payload: any) {
    return request('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async update(id: string, payload: any) {
    return request(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  async updateStatus(id: string, status: string) {
    return request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

export const favoritesApi = {
  async list() {
    return request('/favorites');
  },
  async add(serviceId: string) {
    return request(`/favorites/${serviceId}`, { method: 'POST' });
  },
  async remove(serviceId: string) {
    return request(`/favorites/${serviceId}`, { method: 'DELETE' });
  },
};

export const scheduleApi = {
  async get(date: string, serviceId: string) {
    return request(`/schedule?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`);
  },
};

export const tokenStore = {
  get: getToken,
  set(token: string) {
    localStorage.setItem('access_token', token);
  },
  clear() {
    localStorage.removeItem('access_token');
  },
};
