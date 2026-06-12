import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('pharmacy_token', token);
        localStorage.setItem('pharmacy_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem('pharmacy_token');
        localStorage.removeItem('pharmacy_user');
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (updatedUser) =>
        set((state) => {
          if (!state.user) return state;
          const newUser = { ...state.user, ...updatedUser };
          localStorage.setItem('pharmacy_user', JSON.stringify(newUser));
          return { user: newUser };
        }),
    }),
    {
      name: 'pharmacy_auth',
    }
  )
);
