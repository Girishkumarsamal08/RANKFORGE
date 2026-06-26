import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to load JWT token from local storage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('rankforge_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for automatic signout on session invalidation
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rankforge_token');
        localStorage.removeItem('rankforge_user');
        window.location.href = '/login?reason=session_invalidated';
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth Endpoints ---
export const authApi = {
  login: async (payload: any) => {
    const { data } = await api.post('/auth/login', payload);
    return data;
  },
  register: async (payload: any) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },
  logout: async () => {
    const { data } = await api.post('/auth/logout');
    return data;
  },
  updateProfile: async (payload: { name: string; branch: string }) => {
    const { data } = await api.put('/auth/profile', payload);
    return data;
  },
};

// --- Test Endpoints ---
export const testsApi = {
  start: async (examCode: string) => {
    const { data } = await api.post('/tests/start', { examCode });
    return data;
  },
  submit: async (payload: { attemptId: string; answers: any[]; antiCheatLogs?: any[] }) => {
    const { data } = await api.post('/tests/submit', payload);
    return data;
  },
  getHistory: async () => {
    const { data } = await api.get('/tests/history');
    return data;
  },
  logCheat: async (payload: { attemptId: string; eventType: string; details?: string; answers?: any[] }) => {
    const { data } = await api.post('/tests/cheat-log', payload);
    return data;
  },
  getRemainingTime: async (attemptId: string) => {
    const { data } = await api.get(`/tests/attempt/${attemptId}/time`);
    return data;
  },
};

// --- Analytics Endpoints ---
export const analyticsApi = {
  getDashboard: async () => {
    const { data } = await api.get('/analytics/dashboard');
    return data;
  },
  collegeAdvisor: async (query: string) => {
    const { data } = await api.post('/analytics/college-advisor', { query });
    return data;
  },
};

export default api;
