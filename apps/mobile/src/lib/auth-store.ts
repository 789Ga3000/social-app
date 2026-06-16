import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import api from './api';

export type User = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl?: string | null;
  role?: 'USER' | 'ADMIN';
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => {
  DeviceEventEmitter.addListener('force_logout', async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');
    set({ user: null, isLoading: false });
  });

  return {
    user: null,
    isLoading: true,

  login: async (token, refreshToken, user) => {
    await AsyncStorage.setItem('auth_token', token);
    if (refreshToken) {
      await AsyncStorage.setItem('refresh_token', refreshToken);
    }
    set({ user, isLoading: false });
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');
    set({ user: null, isLoading: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        set({ user: null, isLoading: false });
        return;
      }
      
      const res = await api.get('/users/me');
      set({ user: res.data, isLoading: false });
    } catch (error) {
      await AsyncStorage.removeItem('auth_token');
      set({ user: null, isLoading: false });
    }
  }
  };
});
