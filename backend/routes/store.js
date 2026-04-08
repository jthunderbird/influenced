const express = require('express');
const MedusaService = require('../services/medusa');

const router = express.Router();

const MEDUSA_URL = process.env.MEDUSA_URL || 'http://medusa:9000';
const MEDUSA_PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || '';

function getMedusaService(token = null) {
  const service = new MedusaService();
  service.setBaseUrl(MEDUSA_URL);
  service.setPublishableKey(MEDUSA_PUBLISHABLE_KEY);
  if (token) {
    service.setAdminToken(token);
  }
  return service;
}

const getStoreConfig = () => ({
  enabled: process.env.STORE_ENABLED === 'true',
  source: process.env.STORE_SOURCE || 'internal',
  name: process.env.STORE_NAME || 'Store',
  currency: process.env.STORE_CURRENCY || 'USD',
});

const requireStoreEnabled = (req, res, next) => {
  const config = getStoreConfig();
  if (!config.enabled) {
    return res.status(404).json({ error: 'Store is not enabled' });
  }
  next();
};

router.get('/config', requireStoreEnabled, (req, res) => {
  const config = getStoreConfig();
  res.json({
    enabled: config.enabled,
    source: config.source,
    name: config.name,
    currency: config.currency,
  });
});

router.get('/categories', requireStoreEnabled, async (req, res) => {
  try {
    const service = getMedusaService();
    const result = await service.getStoreCategories();
    res.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/products', requireStoreEnabled, async (req, res) => {
  try {
    const { limit = 50, offset = 0, category } = req.query;
    
    const adminToken = process.env.MEDUSA_ADMIN_TOKEN;
    if (!adminToken) {
      console.error('Store products error: MEDUSA_ADMIN_TOKEN not set');
      return res.status(500).json({ error: 'Store not configured - admin token missing' });
    }
    
    const adminService = getMedusaService(adminToken);
    const result = await adminService.getProducts({ limit: parseInt(limit), offset: parseInt(offset) });
    
    let products = result.products || [];
    if (category) {
      products = products.filter(p => p.collection_id === category);
    }
    
    res.json({ products, count: products.length });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/products/:id', requireStoreEnabled, async (req, res) => {
  try {
    const adminToken = process.env.MEDUSA_ADMIN_TOKEN;
    if (!adminToken) {
      return res.status(500).json({ error: 'Store not configured - admin token missing' });
    }
    
    const adminService = getMedusaService(adminToken);
    const product = await adminService.getProductById(req.params.id);
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/cart', requireStoreEnabled, async (req, res) => {
  try {
    const cartId = req.session.cartId;
    if (!cartId) {
      return res.json({ cart: null });
    }
    const cart = await getMedusaService().getCart(cartId);
    res.json({ cart });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/cart', requireStoreEnabled, async (req, res) => {
  try {
    const { items = [], region_id } = req.body;
    
    const cartData = region_id ? { region_id } : {};
    
    const result = await getMedusaService().createCart(cartData);
    const cart = result.cart;
    
    req.session.cartId = cart.id;
    
    for (const item of items) {
      await getMedusaService().addLineItem(cart.id, item.variantId, item.quantity);
    }
    
    const updatedCart = await getMedusaService().getCart(cart.id);
    res.json({ cart: updatedCart.cart });
  } catch (error) {
    console.error('Error creating cart:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/cart/items', requireStoreEnabled, async (req, res) => {
  try {
    const { variantId, quantity = 1 } = req.body;
    let cartId = req.session.cartId;
    
    if (!cartId) {
      const result = await getMedusaService().createCart({});
      cartId = result.cart.id;
      req.session.cartId = cartId;
    }
    
    await getMedusaService().addLineItem(cartId, variantId, quantity);
    
    const cart = await getMedusaService().getCart(cartId);
    res.json({ cart: cart.cart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/cart/items/:lineItemId', requireStoreEnabled, async (req, res) => {
  try {
    const cartId = req.session.cartId;
    if (!cartId) {
      return res.status(400).json({ error: 'No cart found' });
    }
    
    const { quantity } = req.body;
    const cart = await getMedusaService().getCart(cartId);
    res.json({ cart: cart.cart });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/cart/items/:lineItemId', requireStoreEnabled, async (req, res) => {
  try {
    const cartId = req.session.cartId;
    if (!cartId) {
      return res.status(400).json({ error: 'No cart found' });
    }
    
    const cart = await getMedusaService().getCart(cartId);
    const lineItem = cart.cart.line_items.find(item => item.id === req.params.lineItemId);
    
    if (lineItem) {
      await getMedusaService().updateCart(cartId, {
        line_items: [{
          id: lineItem.id,
          quantity: 0,
        }],
      });
    }
    
    const updatedCart = await getMedusaService().getCart(cartId);
    res.json({ cart: updatedCart.cart });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/cart/discount', requireStoreEnabled, async (req, res) => {
  try {
    const cartId = req.session.cartId;
    if (!cartId) {
      return res.status(400).json({ error: 'No cart found' });
    }
    
    const { code } = req.body;
    
    try {
      await getMedusaService().validateDiscount(code);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid discount code' });
    }
    
    const cart = await getMedusaService().getCart(cartId);
    res.json({ cart: cart.cart, discountApplied: true });
  } catch (error) {
    console.error('Error applying discount:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/checkout', requireStoreEnabled, async (req, res) => {
  try {
    const cartId = req.session.cartId;
    if (!cartId) {
      return res.status(400).json({ error: 'No cart found' });
    }
    
    await getMedusaService().createPaymentSession(cartId, 'stripe');
    
    const cart = await getMedusaService().getCart(cartId);
    
    const paymentSession = cart.cart.payment_sessions?.find(s => s.provider_id === 'stripe');
    
    if (!paymentSession) {
      return res.status(400).json({ error: 'Unable to create payment session' });
    }
    
    res.json({
      cartId,
      paymentSessionId: paymentSession.id,
      redirectUrl: paymentSession.data?.url,
    });
  } catch (error) {
    console.error('Error initiating checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/checkout/complete', requireStoreEnabled, async (req, res) => {
  try {
    const cartId = req.session.cartId;
    if (!cartId) {
      return res.status(400).json({ error: 'No cart found' });
    }
    
    const result = await getMedusaService().completeCart(cartId);
    
    if (result.type === 'order') {
      req.session.cartId = null;
      res.json({ order: result.order, success: true });
    } else {
      res.status(400).json({ error: 'Checkout not completed', data: result });
    }
  } catch (error) {
    console.error('Error completing checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders', requireStoreEnabled, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const orders = await getMedusaService().listOrders({ limit: parseInt(limit), offset: parseInt(offset) });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders/:id', requireStoreEnabled, async (req, res) => {
  try {
    const order = await getMedusaService().getOrder(req.params.id);
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;