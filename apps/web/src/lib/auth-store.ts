'use client';

import { create } from 'zustand';

export type SessionUser = {
  id: string;
  email: string;
  username: string;
  displayName?: string | null;
  role?: 'USER' | 'ADMIN';
};

type AuthState = {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  
  const logout = () => {
    setUser(null);
  };
  
  return { user, setUser, logout };
}
