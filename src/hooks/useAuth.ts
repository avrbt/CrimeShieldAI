import { useState, useEffect } from 'react';
import { authAPI } from '../utils/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'citizen' | 'organization';
  aadhaar?: string;
  phone?: string;
  organization?: string;
  verified?: boolean;
  created_at?: string;
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      setLoading(true);
      const session = await authAPI.getSession();
      
      if (session) {
        const { profile } = await authAPI.getProfile();
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      console.error('Auth check error:', err);
      setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setLoading(true);
      setError(null);
      await authAPI.signIn(email, password);
      await checkAuth();
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }

  async function signUp(data: {
    email: string;
    password: string;
    name: string;
    role: 'citizen' | 'organization';
    aadhaar?: string;
    phone?: string;
    organization?: string;
  }) {
    try {
      setLoading(true);
      setError(null);
      await authAPI.signUp(data);
      await authAPI.signIn(data.email, data.password);
      await checkAuth();
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      setLoading(true);
      await authAPI.signOut();
      setUser(null);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(data: any) {
    try {
      setLoading(true);
      setError(null);
      const result = await authAPI.updateProfile(data);
      setUser(result.profile);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refresh: checkAuth,
  };
}
