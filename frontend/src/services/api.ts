import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  setAuthToken: (token: string) => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
  },
  
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  
  getCurrentUser: () => apiClient.get('/auth/me'),
  
  logout: () => apiClient.post('/auth/logout'),
};

export const notesAPI = {
  getNotes: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/notes', { params }),
  
  getNote: (id: string) => apiClient.get(`/notes/${id}`),
  
  createNote: (data: { title: string; content: string; tags?: string[] }) =>
    apiClient.post('/notes', data),
  
  updateNote: (id: string, data: { title: string; content: string; tags?: string[] }) =>
    apiClient.put(`/notes/${id}`, data),
  
  deleteNote: (id: string) => apiClient.delete(`/notes/${id}`),
};

export const tenantsAPI = {
  getCurrentTenant: () => apiClient.get('/tenants/current'),
  
  upgradeSubscription: (slug: string) =>
    apiClient.post(`/tenants/${slug}/upgrade`),
};

export default apiClient;