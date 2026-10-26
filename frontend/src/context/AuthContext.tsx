import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { toast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  register: (payload: { username: string; email: string; password: string; first_name?: string; last_name?: string }) => Promise<void>;
  logout: () => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('madstory_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('madstory_access_token');
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
          localStorage.setItem('madstory_user', JSON.stringify(userData));
        } catch {
          api.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (u: string, p: string) => {
    const data = await api.login(u, p);
    setUser(data.user);
    setAuthModalOpen(false);
    toast.success(`স্বাগতম, ${data.user.first_name || data.user.username}! লগইন সফল হয়েছে।`, {
      title: 'লগইন সম্পন্ন',
    });
  };

  const register = async (payload: { username: string; email: string; password: string; first_name?: string; last_name?: string }) => {
    const data = await api.register(payload);
    setUser(data.user);
    setAuthModalOpen(false);
    toast.success('অ্যাকাউন্ট সফলভাবে তৈরি ও সক্রিয় হয়েছে!', {
      title: 'রেজিস্ট্রেশন সম্পন্ন',
    });
  };

  const logout = () => {
    api.logout();
    setUser(null);
    toast.info('আপনি সফলভাবে লগআউট করেছেন।', {
      title: 'লগআউট সম্পন্ন',
    });
  };

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
