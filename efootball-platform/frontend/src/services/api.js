import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
};

// Tournament APIs
export const tournamentAPI = {
  getAll: (params) => api.get('/tournaments', { params }),
  getById: (id) => api.get(`/tournaments/${id}`),
  join: (id) => api.post(`/tournaments/${id}/join`),
  create: (data) => api.post('/tournaments', data),
  start: (id) => api.post(`/tournaments/${id}/start`)
};

// Match APIs
export const matchAPI = {
  getMyMatches: () => api.get('/matches/my-matches'),
  getById: (id) => api.get(`/matches/${id}`),
  reportScore: (id, data) => api.post(`/matches/${id}/report`, data),
  dispute: (id, data) => api.post(`/matches/${id}/dispute`, data)
};

// Payment APIs
export const paymentAPI = {
  submit: (data) => api.post('/payments/submit', data),
  getPending: () => api.get('/payments/pending'),
  verify: (id) => api.post(`/payments/${id}/verify`),
  reject: (id, data) => api.post(`/payments/${id}/reject`, data)
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getDisputes: () => api.get('/admin/disputes'),
  resolveDispute: (id, data) => api.post(`/admin/disputes/${id}/resolve`, data),
  getPayouts: (status) => api.get('/admin/payouts', { params: { status } }),
  sendPayout: (id, data) => api.post(`/admin/payouts/${id}/send`, data)
};