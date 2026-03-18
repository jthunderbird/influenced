const express = require('express');
const medusaService = require('../services/medusa');

const router = express.Router();

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

router.get('/config', (req, res) => {
  const config = getStoreConfig();
  res.json({
    enabled: config.enabled,
    source: config.source,
    name: config.name,
    currency: config.currency,
  });
});

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

router.get('/products/:id', requireStoreEnabled, async (req, res) => {
  try {
    const product = await medusaService.getProduct(req.params.id);
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: error.message });
  }
});

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

router.post('/cart', requireStoreEnabled, async (req, res) => {
  try {
    const { items = [], region_id, country_code } = req.body;
    
    const cartData = {
      region_id: region_id || 'us',
      country_code: country_code || 'us',
    };
    
    const result = await medusaService.createCart(cartData);
    const cart = result.cart;
    
    req.session.cartId = cart.id;
    
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

router.post('/cart/items', requireStoreEnabled, async (req, res) => {
  try {
    const { variantId, quantity = 1 } = req.body;
    let cartId = req.session.cartId;
    
    if (!cartId) {
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

router.put('/cart/items/:lineItemId', requireStoreEnabled, async (req, res) => {
  try {
    const cartId = req.session.cartId;
    if (!cartId) {
      return res.status(400).json({ error: 'No cart found' });
    }
    
    const { quantity } = req.body;
    const cart = await medusaService.getCart(cartId);
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
    
    const cart = await medusaService.getCart(cartId);
    const lineItem = cart.cart.line_items.find(item => item.id === req.params.lineItemId);
    
    if (lineItem) {
      await medusaService.updateCart(cartId, {
        line_items: [{
          id: lineItem.id,
          quantity: 0,
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

router.post('/cart/discount', requireStoreEnabled, async (req, res) => {
  try {
    const cartId = req.session.cartId;
    if (!cartId) {
      return res.status(400).json({ error: 'No cart found' });
    }
    
    const { code } = req.body;
    
    try {
      await medusaService.validateDiscount(code);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid discount code' });
    }
    
    const cart = await medusaService.getCart(cartId);
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
    
    await medusaService.createPaymentSession(cartId, 'stripe');
    
    const cart = await medusaService.getCart(cartId);
    
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
    
    const result = await medusaService.completeCart(cartId);
    
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
    const orders = await medusaService.listOrders({ limit: parseInt(limit), offset: parseInt(offset) });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

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