import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import {
  handleSessionSuperseded,
  isSessionSupersededMessage,
} from './session-expired';

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

    if (isSessionSupersededMessage(message)) {
      void handleSessionSuperseded();
      return Promise.reject(error);
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
        const refreshMessage =
          axios.isAxiosError(refreshError) &&
          typeof refreshError.response?.data === 'object' &&
          refreshError.response?.data !== null &&
          'message' in refreshError.response.data
            ? String((refreshError.response.data as { message: unknown }).message)
            : undefined;
        if (isSessionSupersededMessage(refreshMessage)) {
          void handleSessionSuperseded();
        } else {
          useAuthStore.getState().logout();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
