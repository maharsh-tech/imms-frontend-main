import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const SESSION_SUPERSEDED = 'Signed in on another device';

/** Thin HTTP client — all validation and business rules live in the backend. */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest?.url?.includes('/auth/');
    const message = error.response?.data?.message as string | undefined;

    if (
      message?.includes(SESSION_SUPERSEDED) ||
      (error.response?.status === 401 &&
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login'))
    ) {
      if (message?.includes(SESSION_SUPERSEDED)) {
        useAuthStore.getState().logout();
        window.location.href = '/login?error=session_superseded';
        return Promise.reject(error);
      }
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      originalRequest._retry = true;
      try {
        await apiClient.post('/auth/refresh');
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
