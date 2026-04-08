class MedusaService {
  constructor() {
    this._baseUrl = null;
    this._apiKey = null;
    this._publishableKey = null;
    this._adminToken = null;
  }

  get baseUrl() {
    return this._baseUrl || (this._baseUrl = process.env.MEDUSA_URL || 'http://localhost:9000');
  }

  setBaseUrl(url) {
    this._baseUrl = url;
    return this;
  }

  get apiKey() {
    return this._apiKey || (this._apiKey = process.env.MEDUSA_API_KEY || '');
  }

  setApiKey(key) {
    this._apiKey = key;
    return this;
  }

  get publishableKey() {
    return this._publishableKey || (this._publishableKey = process.env.MEDUSA_PUBLISHABLE_KEY || '');
  }

  setPublishableKey(key) {
    this._publishableKey = key;
    return this;
  }

  get adminToken() {
    return this._adminToken;
  }

  setAdminToken(token) {
    this._adminToken = token;
    return this;
  }

  async authenticate(email, password) {
    try {
      const response = await this.request('/auth/user/emailpass', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response.token) {
        this.setAdminToken(response.token);
        return response;
      }
      throw new Error('Authentication failed');
    } catch (err) {
      console.error('Medusa auth error:', err.message);
      throw err;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      ...(this.publishableKey && { 'x-publishable-api-key': this.publishableKey }),
      ...(this.adminToken && { 'Authorization': `Bearer ${this.adminToken}` }),
      ...options.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Medusa API error: ${response.status} - ${error}`);
      }

      return response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  // Store Products (public - requires publishable key)
  async listProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/store/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id) {
    return this.request(`/store/products/${id}`);
  }
  
  // Get product with variants (uses admin API)
  async getProductWithVariants(id) {
    return this.request(`/admin/products/${id}`);
  }

  // Store Categories (public)
  async getStoreCategories(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/store/product-categories${query ? `?${query}` : ''}`);
  }

  // Admin Products
  async getProducts(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const query = queryParams ? `?${queryParams}` : '';
    return this.request(`/admin/products${query}`);
  }

  async getProductById(id) {
    return this.request(`/admin/products/${id}`);
  }

  async createProduct(data) {
    return this.request('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id, data) {
    return this.request(`/admin/products/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id) {
    return this.request(`/admin/products/${id}`, {
      method: 'DELETE',
    });
  }

  async updateVariant(productId, variantId, data) {
    return this.request(`/admin/products/${productId}/variants/${variantId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Inventory Management
  async getInventoryItems() {
    return this.request('/admin/inventory-items');
  }

  async getStockLocations() {
    return this.request('/admin/stock-locations');
  }

  async updateInventoryLevel(inventoryItemId, locationId, quantity) {
    return this.request(`/admin/inventory-items/${inventoryItemId}/location-levels`, {
      method: 'POST',
      body: JSON.stringify({
        location_id: locationId,
        stocked_quantity: quantity,
      }),
    });
  }

  async createInventoryItem(variantId, title, quantity = 0) {
    // First create inventory item
    const item = await this.request('/admin/inventory-items', {
      method: 'POST',
      body: JSON.stringify({
        sku: `inv-${variantId}`,
        title: title,
      }),
    });
    
    if (!item.inventory_item?.id) {
      throw new Error('Failed to create inventory item');
    }
    
    // Link inventory item to variant
    await this.request(`/admin/variants/${variantId}`, {
      method: 'POST',
      body: JSON.stringify({
        inventory_items: [{
          item: item.inventory_item.id,
          required_quantity: 0,
        }],
      }),
    });
    
    // Get stock location
    const locations = await this.getStockLocations();
    const locationId = locations.stock_locations?.[0]?.id;
    
    if (locationId && quantity > 0) {
      await this.updateInventoryLevel(item.inventory_item.id, locationId, quantity);
    }
    
    return item;
  }

  async getVariantInventoryItem(variantId) {
    const items = await this.getInventoryItems();
    return items.inventory_items?.find(item => item.metadata?.variant_id === variantId);
  }

  // Admin Orders
  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/orders${query ? `?${query}` : ''}`);
  }

  async getOrderById(id) {
    return this.request(`/admin/orders/${id}`);
  }

  // Cart
  async createCart(data = {}) {
    return this.request('/store/carts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCart(id) {
    return this.request(`/store/carts/${id}`);
  }

  // Line Items (Medusa v2)
  async addLineItem(cartId, variantId, quantity) {
    return this.request(`/store/carts/${cartId}/line-items`, {
      method: 'POST',
      body: JSON.stringify({ variant_id: variantId, quantity }),
    });
  }

  async updateLineItem(cartId, lineItemId, data) {
    return this.request(`/store/carts/${cartId}/line-items/${lineItemId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteLineItem(cartId, lineItemId) {
    return this.request(`/store/carts/${cartId}/line-items/${lineItemId}`, {
      method: 'DELETE',
    });
  }

  // Checkout
  async createPaymentSession(cartId, providerId = 'stripe') {
    return this.request(`/store/carts/${cartId}/payment-sessions`, {
      method: 'POST',
      body: JSON.stringify({ provider_id: providerId }),
    });
  }

  async completeCart(cartId) {
    return this.request(`/store/carts/${cartId}/complete`, {
      method: 'POST',
    });
  }

  // Discounts
  async listDiscounts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/discounts${query ? `?${query}` : ''}`);
  }

  async createDiscount(data) {
    return this.request('/admin/discounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async validateDiscount(code) {
    return this.request(`/store/discounts/${code}`);
  }
}

module.exports = MedusaService;
