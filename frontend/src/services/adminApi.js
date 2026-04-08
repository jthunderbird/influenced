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

  restart: async () => {
    const response = await apiClient.post('/admin/restart');
    return response.data;
  },

  // Settings by category
  getSettings: async () => {
    const response = await apiClient.get('/admin/settings');
    return response.data;
  },

  getSocialSettings: async () => {
    const response = await apiClient.get('/admin/settings/social');
    return response.data;
  },

  getContentSettings: async () => {
    const response = await apiClient.get('/admin/settings/content');
    return response.data;
  },

  getStoreSettings: async () => {
    const response = await apiClient.get('/admin/settings/store');
    return response.data;
  },
  getMedusaProducts: async () => {
    const response = await apiClient.get('/admin/medusa/products');
    return response.data;
  },

  getMedusaProduct: async (id) => {
    const response = await apiClient.get(`/admin/medusa/products/${id}`);
    return response.data;
  },

  createMedusaProduct: async (product) => {
    const response = await apiClient.post('/admin/medusa/products', product);
    return response.data;
  },

  updateMedusaProduct: async (id, product) => {
    const response = await apiClient.put(`/admin/medusa/products/${id}`, product);
    return response.data;
  },

  deleteMedusaProduct: async (id) => {
    const response = await apiClient.delete(`/admin/medusa/products/${id}`);
    return response.data;
  },

  updateMedusaVariant: async (productId, variantId, variant) => {
    const response = await apiClient.post(`/admin/medusa/products/${productId}/variants/${variantId}`, variant);
    return response.data;
  },

  updateVariantInventory: async (productId, variantId, quantity) => {
    const response = await apiClient.post(`/admin/medusa/products/${productId}/variants/${variantId}/inventory`, { quantity });
    return response.data;
  },

  getVariantInventory: async (productId, variantId) => {
    const response = await apiClient.get(`/admin/medusa/products/${productId}/variants/${variantId}/inventory`);
    return response.data;
  },

  saveSettings: async (settings) => {
    const response = await apiClient.post('/admin/settings', settings);
    return response.data;
  },

  getStoreConfig: async () => {
    const response = await apiClient.get('/admin/store-config');
    return response.data;
  },

  // Medusa Orders
  getMedusaOrders: async () => {
    const response = await apiClient.get('/admin/medusa/orders');
    return response.data;
  },

  getMedusaOrder: async (id) => {
    const response = await apiClient.get(`/admin/medusa/orders/${id}`);
    return response.data;
  },
};
