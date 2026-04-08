import axios from 'axios';

const API_BASE = '/api';

const storeApi = {
  async getConfig() {
    const response = await axios.get(`${API_BASE}/store/config`);
    return response.data;
  },

  async getProducts(params = {}) {
    const response = await axios.get(`${API_BASE}/store/products`, { params });
    return response.data;
  },

  async getProduct(id) {
    const response = await axios.get(`${API_BASE}/store/products/${id}`);
    return response.data;
  },

  async getCart() {
    const response = await axios.get(`${API_BASE}/store/cart`);
    return response.data;
  },

  async createCart(items = [], regionId = 'us') {
    const response = await axios.post(`${API_BASE}/store/cart`, {
      items,
      region_id: regionId,
    });
    return response.data;
  },

  async addToCart(variantId, quantity = 1) {
    const response = await axios.post(`${API_BASE}/store/cart/items`, {
      variantId,
      quantity,
    });
    return response.data;
  },

  async updateCartItem(lineItemId, quantity) {
    const response = await axios.put(`${API_BASE}/store/cart/items/${lineItemId}`, {
      quantity,
    });
    return response.data;
  },

  async removeCartItem(lineItemId) {
    const response = await axios.delete(`${API_BASE}/store/cart/items/${lineItemId}`);
    return response.data;
  },

  async initiateCheckout() {
    const response = await axios.post(`${API_BASE}/store/checkout`);
    return response.data;
  },

  async completeCheckout() {
    const response = await axios.post(`${API_BASE}/store/checkout/complete`);
    return response.data;
  },

  async getOrder(orderId) {
    const response = await axios.get(`${API_BASE}/store/orders/${orderId}`);
    return response.data;
  },
};

export default storeApi;
