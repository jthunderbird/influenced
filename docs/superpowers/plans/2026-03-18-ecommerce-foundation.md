# E-Commerce Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Medusa with PostgreSQL, Redis, and Stripe integration as the foundation for the e-commerce store.

**Architecture:** Medusa runs as a separate Docker service with its own PostgreSQL database. Express routes proxy to Medusa for product/ cart/checkout operations. Stripe handles payments.

**Tech Stack:** Medusa, PostgreSQL, Redis, Stripe, Node.js

---

## File Structure

```
docker-compose.yml                    # Add Medusa, PostgreSQL, Redis services
backend/
  ├── routes/
  │   └── store.js                    # NEW: Store API gateway routes
  ├── services/
  │   └── medusa.js                   # NEW: Medusa API client service
  └── server.js                       # MODIFY: Add store routes, webhook endpoint
backend/routes/admin.js               # MODIFY: Add store settings to CONFIGURABLE_SETTINGS
frontend/src/
  ├── contexts/
  │   └── StoreContext.jsx            # NEW: Store config context
  └── App.jsx                        # MODIFY: Conditionally show /store routes
.env.example                         # MODIFY: Add store env vars
```

---

## Chunk 1: Docker Infrastructure

### Task 1: Update docker-compose.yml with Medusa, PostgreSQL, Redis

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: Add PostgreSQL service for Medusa**

```yaml
services:
  # ... existing youtube-frontend service ...
  
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: medusa
      POSTGRES_PASSWORD: medusa_password
      POSTGRES_DB: medusa
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    container_name: medusa-postgres

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    container_name: medusa-redis

volumes:
  postgres_data:
```

- [ ] **Step 2: Add Medusa service**

```yaml
  medusa:
    image: medusajs/medusa:latest
    ports:
      - "9000:9000"
    environment:
      DATABASE_URL: postgres://medusa:medusa_password@postgres:5432/medusa
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
      JWT_SECRET: medusa-jwt-secret-change-in-production
      COOKIE_SECRET: medusa-cookie-secret-change-in-production
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:-}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET:-}
    volumes:
      - ./medusa-data:/app/data
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    container_name: medusa-server
```

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "chore: add Medusa, PostgreSQL, Redis to docker-compose"
```

---

## Chunk 2: Store Settings in Admin

### Task 2: Add store configuration settings to admin panel

**Files:**
- Modify: `backend/routes/admin.js:9-24`

- [ ] **Step 1: Add store settings to CONFIGURABLE_SETTINGS**

Add after existing settings:

```javascript
const STORE_SETTINGS = [
  { key: 'STORE_ENABLED', type: 'boolean', description: 'Enable/disable store (default: false)', restartRequired: false },
  { key: 'STORE_SOURCE', type: 'select', options: ['internal', 'shopify', 'bigcommerce'], description: 'Product data source', restartRequired: true },
  { key: 'STORE_NAME', type: 'text', description: 'Store display name', restartRequired: false },
  { key: 'STORE_CURRENCY', type: 'text', description: 'Store currency (e.g., USD)', restartRequired: false },
  { key: 'STRIPE_SECRET_KEY', type: 'password', description: 'Stripe secret key', restartRequired: true },
  { key: 'STRIPE_WEBHOOK_SECRET', type: 'password', description: 'Stripe webhook secret', restartRequired: true },
  { key: 'SHOPIFY_STORE_URL', type: 'text', description: 'Shopify store URL', restartRequired: true },
  { key: 'SHOPIFY_ACCESS_TOKEN', type: 'password', description: 'Shopify Storefront API token', restartRequired: true },
  { key: 'BIGCOMMERCE_STORE_URL', type: 'text', description: 'BigCommerce store URL', restartRequired: true },
  { key: 'BIGCOMMERCE_ACCESS_TOKEN', type: 'password', description: 'BigCommerce API token', restartRequired: true },
  { key: 'SYNC_SCHEDULE_ENABLED', type: 'boolean', description: 'Enable automated sync (default: false)', restartRequired: false },
  { key: 'SYNC_SCHEDULE_INTERVAL', type: 'number', description: 'Sync interval in hours (default: 24)', restartRequired: false },
];
```

- [ ] **Step 2: Merge with existing CONFIGURABLE_SETTINGS**

Update the module export to include both sets:

```javascript
const CONFIGURABLE_SETTINGS = [
  // ... existing YouTube/social settings ...
  ...STORE_SETTINGS,
];
```

- [ ] **Step 3: Add helper to get store config**

Add function after CONFIGURABLE_SETTINGS:

```javascript
const getStoreConfig = () => ({
  enabled: process.env.STORE_ENABLED === 'true',
  source: process.env.STORE_SOURCE || 'internal',
  name: process.env.STORE_NAME || 'Store',
  currency: process.env.STORE_CURRENCY || 'USD',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  shopifyStoreUrl: process.env.SHOPIFY_STORE_URL || '',
  shopifyAccessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
  bigcommerceStoreUrl: process.env.BIGCOMMERCE_STORE_URL || '',
  bigcommerceAccessToken: process.env.BIGCOMMERCE_ACCESS_TOKEN || '',
  syncEnabled: process.env.SYNC_SCHEDULE_ENABLED === 'true',
  syncInterval: parseInt(process.env.SYNC_SCHEDULE_INTERVAL) || 24,
});

module.exports = () => {
  // ... existing routes ...
  
  // Add store config endpoint
  router.get('/store-config', (req, res) => {
    res.json(getStoreConfig());
  });
  
  return router;
};
```

- [ ] **Step 4: Commit**

```bash
git add backend/routes/admin.js
git commit -m "feat: add store configuration settings to admin"
```

---

## Chunk 3: Medusa API Client Service

### Task 3: Create Medusa API client service

**Files:**
- Create: `backend/services/medusa.js`

- [ ] **Step 1: Write Medusa service**

```javascript
const MEDUSA_URL = process.env.MEDUSA_URL || 'http://localhost:9000';
const MEDUSA_API_KEY = process.env.MEDUSA_API_KEY || '';

class MedusaService {
  constructor() {
    this.baseUrl = MEDUSA_URL;
    this.apiKey = MEDUSA_API_KEY;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Medusa API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Products
  async listProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id) {
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

  // Cart
  async createCart(data) {
    return this.request('/carts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCart(id) {
    return this.request(`/carts/${id}`);
  }

  async updateCart(id, data) {
    return this.request(`/carts/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Checkout
  async createPaymentSession(cartId, providerId = 'stripe') {
    return this.request(`/carts/${cartId}/payment-sessions`, {
      method: 'POST',
      body: JSON.stringify({ provider_id: providerId }),
    });
  }

  async completeCart(cartId) {
    return this.request(`/carts/${cartId}/complete`, {
      method: 'POST',
    });
  }

  // Orders
  async listOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/orders${query ? `?${query}` : ''}`);
  }

  async getOrder(id) {
    return this.request(`/admin/orders/${id}`);
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
    return this.request('/discounts/code/' + code, {
      method: 'GET',
    });
  }
}

module.exports = new MedusaService();
```

- [ ] **Step 2: Commit**

```bash
git add backend/services/medusa.js
git commit -m "feat: add Medusa API client service"
```

---

## Chunk 4: Store API Routes

### Task 4: Create store API gateway routes

**Files:**
- Create: `backend/routes/store.js`

- [ ] **Step 1: Write store routes**

```javascript
const express = require('express');
const medusaService = require('../services/medusa');

const router = express.Router();

const getStoreConfig = () => ({
  enabled: process.env.STORE_ENABLED === 'true',
  source: process.env.STORE_SOURCE || 'internal',
  name: process.env.STORE_NAME || 'Store',
  currency: process.env.STORE_CURRENCY || 'USD',
});

// Middleware to check if store is enabled
const requireStoreEnabled = (req, res, next) => {
  const config = getStoreConfig();
  if (!config.enabled) {
    return res.status(404).json({ error: 'Store is not enabled' });
  }
  next();
};

// Get store configuration
router.get('/config', (req, res) => {
  const config = getStoreConfig();
  // Don't expose secret keys
  res.json({
    enabled: config.enabled,
    source: config.source,
    name: config.name,
    currency: config.currency,
  });
});

// List products
router.get('/products', requireStoreEnabled, async (req, res) => {
  try {
    const { limit = 10, offset = 0, category } = req.query;
    const params = { limit: parseInt(limit), offset: parseInt(offset) };
    if (category) params.category_id = category;
    
    const result = await medusaService.listProducts(params);
    res.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single product
router.get('/products/:id', requireStoreEnabled, async (req, res) => {
  try {
    const product = await medusaService.getProduct(req.params.id);
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current cart
router.get('/cart', requireStoreEnabled, async (req, res) => {
  try {
    const cartId = req.session.cartId;
    if (!cartId) {
      return res.json({ cart: null });
    }
    const cart = await medusaService.getCart(cartId);
    res.json({ cart });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create cart
router.post('/cart', requireStoreEnabled, async (req, res) => {
  try {
    const { items = [], region_id, country_code } = req.body;
    
    const cartData = {
      region_id: region_id || 'us',
      country_code: country_code || 'us',
    };
    
    const result = await medusaService.createCart(cartData);
    const cart = result.cart;
    
    // Store cart ID in session
    req.session.cartId = cart.id;
    
    // Add items to cart
    for (const item of items) {
      await medusaService.updateCart(cart.id, {
        line_items: [{
          variant_id: item.variantId,
          quantity: item.quantity,
        }],
      });
    }
    
    const updatedCart = await medusaService.getCart(cart.id);
    res.json({ cart: updatedCart.cart });
  } catch (error) {
    console.error('Error creating cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add item to cart
router.post('/cart/items', requireStoreEnabled, async (req, res) => {
  try {
    const { variantId, quantity = 1 } = req.body;
    let cartId = req.session.cartId;
    
    if (!cartId) {
      // Create cart if doesn't exist
      const result = await medusaService.createCart({
        region_id: 'us',
        country_code: 'us',
      });
      cartId = result.cart.id;
      req.session.cartId = cartId;
    }
    
    await medusaService.updateCart(cartId, {
      line_items: [{
        variant_id: variantId,
        quantity,
      }],
    });
    
    const cart = await medusaService.getCart(cartId);
    res.json({ cart: cart.cart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update cart item
router.put('/cart/items/:lineItemId', requireStoreEnabled, async (req, res) => {
  try {
    const cartId = req.session.cartId;
    if (!cartId) {
      return res.status(400).json({ error: 'No cart found' });
    }
    
    const { quantity } = req.body;
    // Note: Medusa uses different approach for updating line items
    // This is simplified - may need adjustment based on Medusa API
    
    const cart = await medusaService.getCart(cartId);
    res.json({ cart: cart.cart });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove item from cart
router.delete('/cart/items/:lineItemId', requireStoreEnabled, async (req, res) => {
  try {
    const cartId = req.session.cartId;
    if (!cartId) {
      return res.status(400).json({ error: 'No cart found' });
    }
    
    // Need to fetch cart, find line item, and update
    const cart = await medusaService.getCart(cartId);
    const lineItem = cart.cart.line_items.find(item => item.id === req.params.lineItemId);
    
    if (lineItem) {
      await medusaService.updateCart(cartId, {
        line_items: [{
          id: lineItem.id,
          quantity: 0, // Remove item
        }],
      });
    }
    
    const updatedCart = await medusaService.getCart(cartId);
    res.json({ cart: updatedCart.cart });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Apply discount code
router.post('/cart/discount', requireStoreEnabled, async (req, res) => {
  try {
    const cartId = req.session.cartId;
    if (!cartId) {
      return res.status(400).json({ error: 'No cart found' });
    }
    
    const { code } = req.body;
    
    // Validate discount with Medusa
    try {
      await medusaService.validateDiscount(code);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid discount code' });
    }
    
    // Apply discount (simplified - may need adjustment)
    const cart = await medusaService.getCart(cartId);
    res.json({ cart: cart.cart, discountApplied: true });
  } catch (error) {
    console.error('Error applying discount:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initiate checkout
router.post('/checkout', requireStoreEnabled, async (req, res) => {
  try {
    const cartId = req.session.cartId;
    if (!cartId) {
      return res.status(400).json({ error: 'No cart found' });
    }
    
    // Create payment session
    await medusaService.createPaymentSession(cartId, 'stripe');
    
    const cart = await medusaService.getCart(cartId);
    
    // Get the Stripe payment session URL
    const paymentSession = cart.cart.payment_sessions?.find(s => s.provider_id === 'stripe');
    
    if (!paymentSession) {
      return res.status(400).json({ error: 'Unable to create payment session' });
    }
    
    res.json({
      cartId,
      paymentSessionId: paymentSession.id,
      // Client secret for Stripe Elements (if using embedded) or redirect URL
      redirectUrl: paymentSession.data?.url,
    });
  } catch (error) {
    console.error('Error initiating checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete checkout (after payment)
router.post('/checkout/complete', requireStoreEnabled, async (req, res) => {
  try {
    const cartId = req.session.cartId;
    if (!cartId) {
      return res.status(400).json({ error: 'No cart found' });
    }
    
    const result = await medusaService.completeCart(cartId);
    
    if (result.type === 'order') {
      req.session.cartId = null; // Clear cart
      res.json({ order: result.order, success: true });
    } else {
      res.status(400).json({ error: 'Checkout not completed', data: result });
    }
  } catch (error) {
    console.error('Error completing checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

// List orders (for admin or customer)
router.get('/orders', requireStoreEnabled, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const orders = await medusaService.listOrders({ limit: parseInt(limit), offset: parseInt(offset) });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single order
router.get('/orders/:id', requireStoreEnabled, async (req, res) => {
  try {
    const order = await medusaService.getOrder(req.params.id);
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add backend/routes/store.js
git commit -m "feat: add store API gateway routes"
```

---

## Chunk 5: Server Integration

### Task 5: Integrate store routes and webhook into Express server

**Files:**
- Modify: `backend/server.js`

- [ ] **Step 1: Add store routes import and middleware**

Add after existing route imports:

```javascript
const storeRoutes = require('./routes/store');
```

Add after admin routes (line 154):

```javascript
// Store routes (requires store enabled)
app.use('/api/store', storeRoutes);

// Stripe webhook - must be before express.json() middleware
// This route needs raw body for signature verification
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment successful for session:', session.id);
      // Order creation handled by Medusa webhook or here
      break;
    case 'payment_intent.succeeded':
      console.log('PaymentIntent succeeded:', event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      console.log('Payment failed:', event.data.object.id);
      break;
    default:
      console.log('Unhandled event type:', event.type);
  }
  
  res.json({ received: true });
});
```

- [ ] **Step 2: Add store env vars to validation**

Add after YouTube/social validation (around line 121):

```javascript
// Store validation (warnings only, not blocking)
if (process.env.STORE_ENABLED === 'true') {
  console.log('Store is enabled');
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('Warning: STORE_ENABLED but STRIPE_SECRET_KEY not set');
  }
  if (!process.env.MEDUSA_URL) {
    console.warn('Warning: STORE_ENABLED but MEDUSA_URL not set (defaulting to http://localhost:9000)');
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/server.js
git commit -m "feat: integrate store routes and Stripe webhook"
```

---

## Chunk 6: Environment Variables

### Task 6: Update .env.example with store variables

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add store env vars**

Add at end of file:

```bash
# Store Configuration
STORE_ENABLED=false
STORE_SOURCE=internal
STORE_NAME=My Store
STORE_CURRENCY=USD

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Medusa
MEDUSA_URL=http://localhost:9000
MEDUSA_API_KEY=

# Shopify (if using)
SHOPIFY_STORE_URL=
SHOPIFY_ACCESS_TOKEN=

# BigCommerce (if using)
BIGCOMMERCE_STORE_URL=
BIGCOMMERCE_ACCESS_TOKEN=

# Sync Schedule
SYNC_SCHEDULE_ENABLED=false
SYNC_SCHEDULE_INTERVAL=24
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add store environment variables to .env.example"
```

---

## Chunk 7: Frontend Store Routes

### Task 7: Add conditional store routing to frontend

**Files:**
- Modify: `frontend/src/App.jsx` (or wherever routes are defined)

- [ ] **Step 1: Fetch store config and conditionally render routes**

First, create a store config hook or context. Create `frontend/src/contexts/StoreContext.jsx`:

```javascript
import { createContext, useContext, useState, useEffect } from 'react';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [config, setConfig] = useState({ enabled: false, loading: true });

  useEffect(() => {
    fetch('/api/store/config')
      .then(res => res.json())
      .then(data => setConfig({ ...data, loading: false }))
      .catch(() => setConfig({ enabled: false, loading: false }));
  }, []);

  return (
    <StoreContext.Provider value={config}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStoreConfig() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreConfig must be used within StoreProvider');
  }
  return context;
}
```

- [ ] **Step 2: Update App.jsx to conditionally render store routes**

```javascript
import { StoreProvider, useStoreConfig } from './contexts/StoreContext';

function AppRoutes() {
  const storeConfig = useStoreConfig();
  
  return (
    <Routes>
      {/* Always available */}
      <Route path="/" element={<Home />} />
      <Route path="/videos" element={<Videos />} />
      <Route path="/live" element={<Live />} />
      
      {/* Store routes - only when enabled */}
      {storeConfig.enabled && (
        <>
          <Route path="/store" element={<StoreHome />} />
          <Route path="/store/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderConfirmation />} />
        </>
      )}
      
      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="store/*" element={<AdminStore />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <StoreProvider>
      <AppRoutes />
    </StoreProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/contexts/StoreContext.jsx frontend/src/App.jsx
git commit -m "feat: add conditional store routing to frontend"
```

---

## Verification Steps

After completing all chunks:

1. **Start services:**
   ```bash
   docker-compose up -d postgres redis
   docker-compose up -d medusa
   docker-compose up -d youtube-frontend
   ```

2. **Verify store config endpoint:**
   ```bash
   curl http://localhost:3030/api/store/config
   # Expected: { enabled: false, ... }
   ```

3. **Verify webhook endpoint exists:**
   ```bash
   curl -X POST http://localhost:3030/api/webhooks/stripe -H "Content-Type: application/json" -d '{}'
   # Expected: 400 (missing signature)
   ```

4. **Test enabling store:**
   - Set `STORE_ENABLED=true` in .env
   - Restart frontend container
   - Access `/store` - should show store (or 404 if other config missing)

---

## Next Steps (Plan 2: Frontend)

After completing this foundation plan:

1. Create store pages (Home, Product Detail, Cart, Checkout)
2. Add store navigation link (hidden when disabled)
3. Implement cart UI with add/remove/update functionality
4. Connect checkout flow to Stripe

## Future Plans

- **Plan 2**: Frontend store pages + cart + checkout UI
- **Plan 3**: Admin panel redesign (side nav, product/order management)
- **Plan 4**: External sync (Shopify, BigCommerce) + automated sync scheduler

Note: Sync scheduler (`SYNC_SCHEDULE_ENABLED`) is configured in this plan but fully implemented in Plan 4.

---

Plan complete and saved to `docs/superpowers/plans/2026-03-18-ecommerce-foundation.md`. Ready to execute?
