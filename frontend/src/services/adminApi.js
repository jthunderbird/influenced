import axios from 'axios';

const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

export const adminApi = {
  login: async (username, password) => {
    const response = await apiClient.post('/admin/login', { username, password });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/admin/logout');
    return response.data;
  },

  getSettings: async () => {
    const response = await apiClient.get('/admin/settings');
    return response.data;
  },

  saveSettings: async (settings) => {
    const response = await apiClient.post('/admin/settings', settings);
    return response.data;
  },

  restart: async () => {
    const response = await apiClient.post('/admin/restart');
    return response.data;
  }
};
