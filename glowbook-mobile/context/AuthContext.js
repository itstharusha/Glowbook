import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('glowbook_token');
      const storedUser = await AsyncStorage.getItem('glowbook_user');
      
      if (storedToken && storedUser) {
        // Validate token with backend
        try {
          const response = await api.get('/api/users/profile', {
            headers: { Authorization: `Bearer ${storedToken}` },
            timeout: 5000,
          });
          
          if (response.data.success || response.data.data) {
            const validatedUser = response.data.data || response.data.user;
            setToken(storedToken);
            setUser(validatedUser);
            // Update stored user with fresh data from server
            await AsyncStorage.setItem('glowbook_user', JSON.stringify(validatedUser));
          }
        } catch (tokenError) {
          // Token is invalid or expired
          console.log('Token validation failed, clearing auth:', tokenError.message);
          await AsyncStorage.removeItem('glowbook_token');
          await AsyncStorage.removeItem('glowbook_user');
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      const response = await api.post('/api/auth/login', { email, password });
      console.log('Login API Response:', response.data);
      
      // Try to handle both { data: { user, token } } and { user, token }
      const authData = response.data.data || response.data;
      const { user, token } = authData;

      if (!token || !user) {
        throw new Error('Invalid response format: user or token missing');
      }
      
      await AsyncStorage.setItem('glowbook_token', token);
      await AsyncStorage.setItem('glowbook_user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Login Error:', error);
      const message = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (name, email, password, role = 'customer') => {
    try {
      console.log('Attempting registration for:', email, 'as', role);
      const response = await api.post('/api/auth/register', { name, email, password, role });
      console.log('Register API Response:', response.data);
      
      const authData = response.data.data || response.data;
      const { user, token } = authData;

      if (!token || !user) {
        throw new Error('Invalid response format: user or token missing');
      }
      
      await AsyncStorage.setItem('glowbook_token', token);
      await AsyncStorage.setItem('glowbook_user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Registration Error:', error);
      const message = error.response?.data?.message || error.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await api.get('/api/users/profile');
      const updatedUser = response.data.data;
      
      await AsyncStorage.setItem('glowbook_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Refresh Profile Error:', error);
      return { success: false, message: error.message };
    }
  };

  const socialLogin = async (user, token) => {
    try {
      if (!token || !user) {
        throw new Error('Invalid user or token');
      }
      
      await AsyncStorage.setItem('glowbook_token', token);
      await AsyncStorage.setItem('glowbook_user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Social Login Error:', error);
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('glowbook_token');
      await AsyncStorage.removeItem('glowbook_user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const updateUser = async (updatedFields) => {
    const updatedUser = { ...user, ...updatedFields };
    await AsyncStorage.setItem('glowbook_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    socialLogin,
    refreshProfile,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
