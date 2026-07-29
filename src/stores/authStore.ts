import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapped: boolean;

  setUser: (user: User) => void;
  setBootstrapped: (value: boolean) => void;
  logout: () => void;
}

/** Tokens live in httpOnly cookies — never in JS/localStorage (XSS-safe). */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isBootstrapped: false,

  setUser: (user) => set({ user, isAuthenticated: true }),

  setBootstrapped: (value) => set({ isBootstrapped: value }),

  logout: () => set({ user: null, isAuthenticated: false }),
}));
