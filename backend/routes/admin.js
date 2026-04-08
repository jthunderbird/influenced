const express = require('express');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const cache = require('../services/cache');
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

const STORE_SETTINGS = [
  { key: 'STORE_ENABLED', type: 'boolean', description: 'Enable/disable store (default: false)', restartRequired: false },
  { key: 'STORE_NAME', type: 'text', description: 'Store display name', restartRequired: false },
  { 
    key: 'STORE_CURRENCY', 
    type: 'select', 
    description: 'Store currency for pricing',
    options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'MXN', 'BRL'],
    restartRequired: false 
  },
  { key: 'MEDUSA_ADMIN_EMAIL', type: 'text', description: 'Medusa admin email for product management', restartRequired: true },
  { key: 'MEDUSA_ADMIN_PASSWORD', type: 'password', description: 'Medusa admin password for product management', restartRequired: true },
  { key: 'STRIPE_SECRET_KEY', type: 'password', description: 'Stripe secret key', restartRequired: true },
  { key: 'STRIPE_WEBHOOK_SECRET', type: 'password', description: 'Stripe webhook secret', restartRequired: true },
  // Shopify Configuration
  { key: 'SHOPIFY_STORE_URL', type: 'text', description: 'Shopify store URL (e.g., https://store.myshopify.com)', restartRequired: true },
  { key: 'SHOPIFY_ACCESS_TOKEN', type: 'password', description: 'Shopify Admin API access token', restartRequired: true },
  // BigCommerce Configuration
  { key: 'BIGCOMMERCE_STORE_URL', type: 'text', description: 'BigCommerce store URL', restartRequired: true },
  { key: 'BIGCOMMERCE_ACCESS_TOKEN', type: 'password', description: 'BigCommerce API access token', restartRequired: true },
  { key: 'BIGCOMMERCE_CLIENT_ID', type: 'text', description: 'BigCommerce OAuth client ID', restartRequired: true },
  { key: 'BIGCOMMERCE_CLIENT_SECRET', type: 'password', description: 'BigCommerce OAuth client secret', restartRequired: true },
  // Sync Settings
  { key: 'SYNC_SCHEDULE_ENABLED', type: 'boolean', description: 'Enable automated sync (default: false)', restartRequired: false },
  { key: 'SYNC_SCHEDULE_INTERVAL', type: 'number', description: 'Sync interval in hours (default: 24)', restartRequired: false },
];

const CONTENT_SETTINGS = [
  { key: 'RECENT_DAYS', type: 'number', description: 'Number of days to look back for recent content on home page', restartRequired: false },
  { key: 'RECENT_VIDEOS', type: 'number', description: 'Maximum number of recent videos to display on home page', restartRequired: false },
  { key: 'RECENT_SHORTS', type: 'number', description: 'Maximum number of recent shorts to display on home page', restartRequired: false },
  { key: 'RECENT_LIVE', type: 'number', description: 'Maximum number of recent live streams to display', restartRequired: false },
  { key: 'RECENT_POSTS', type: 'number', description: 'Maximum number of recent posts to display', restartRequired: false },
];

const SOCIAL_SETTINGS = [
  { key: 'FACEBOOK_HANDLE', type: 'text', description: 'Facebook username without @', restartRequired: false },
  { key: 'X_HANDLE', type: 'text', description: 'X/Twitter username without @', restartRequired: false },
  { key: 'TIKTOK_HANDLE', type: 'text', description: 'TikTok username without @', restartRequired: false },
  { key: 'INSTAGRAM_HANDLE', type: 'text', description: 'Instagram username without @', restartRequired: false },
];

const CONFIGURABLE_SETTINGS = [
  { key: 'YOUTUBE_API_KEY', type: 'text', description: 'Your YouTube Data API v3 key from Google Cloud Console', restartRequired: true },
  { key: 'YOUTUBE_CHANNEL_HANDLE', type: 'text', description: 'YouTube channel handle (e.g., @username or channel ID starting with UC)', restartRequired: true },
  { key: 'ALLOWED_ORIGINS', type: 'text', description: 'Comma-separated list of allowed CORS origins (leave empty to allow all)', restartRequired: false },
  { key: 'ADMIN_USERNAME', type: 'text', description: 'Username for admin panel login', restartRequired: true },
  { key: 'ADMIN_PASSWORD', type: 'password', description: 'Password for admin panel login', restartRequired: true },
  { key: 'USE_HELMET', type: 'boolean', description: 'Enable security headers (helmet.js)', restartRequired: false },
  { key: 'USE_RATE_LIMIT', type: 'boolean', description: 'Enable API rate limiting', restartRequired: false },
];

const getStoreConfig = () => ({
  enabled: process.env.STORE_ENABLED === 'true',
  source: process.env.STORE_SOURCE || 'internal',
  name: process.env.STORE_NAME || 'Store',
  currency: process.env.STORE_CURRENCY || 'USD',
  shopifyStoreUrl: process.env.SHOPIFY_STORE_URL || '',
  bigcommerceStoreUrl: process.env.BIGCOMMERCE_STORE_URL || '',
  syncEnabled: process.env.SYNC_SCHEDULE_ENABLED === 'true',
  syncInterval: parseInt(process.env.SYNC_SCHEDULE_INTERVAL) || 24,
  // Secrets are write-only - not returned to frontend
});

module.exports = () => {
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const adminUser = process.env.ADMIN_USERNAME || 'admin';
      const adminPass = process.env.ADMIN_PASSWORD || 'Password!123';
      
      if (username === adminUser && password === adminPass) {
        req.session.authenticated = true;
        req.session.username = username;

        // Authenticate with Medusa and store token
        try {
          const medusaEmail = process.env.MEDUSA_ADMIN_EMAIL;
          const medusaPassword = process.env.MEDUSA_ADMIN_PASSWORD;
          
          if (medusaEmail && medusaPassword) {
            const service = getMedusaService();
            const authResult = await service.authenticate(medusaEmail, medusaPassword);
            if (authResult.token) {
              req.session.medusaToken = authResult.token;
            }
          }
        } catch (medusaErr) {
          console.log('Medusa auth failed (non-critical):', medusaErr.message);
        }

        return res.json({ success: true });
      }
      
      res.status(401).json({ error: 'Invalid credentials' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
  });

  router.get('/settings', authMiddleware, (req, res) => {
    const settings = CONFIGURABLE_SETTINGS.map(s => ({
      key: s.key,
      type: s.type,
      description: s.description,
      restartRequired: s.restartRequired,
      value: process.env[s.key] || ''
    }));
    res.json(settings);
  });

  router.get('/settings/social', authMiddleware, (req, res) => {
    const settings = SOCIAL_SETTINGS.map(s => ({
      key: s.key,
      type: s.type,
      description: s.description,
      restartRequired: s.restartRequired,
      value: process.env[s.key] || ''
    }));
    res.json(settings);
  });

  router.get('/settings/content', authMiddleware, (req, res) => {
    const settings = CONTENT_SETTINGS.map(s => ({
      key: s.key,
      type: s.type,
      description: s.description,
      restartRequired: s.restartRequired,
      value: process.env[s.key] || ''
    }));
    res.json(settings);
  });

  router.get('/settings/store', authMiddleware, (req, res) => {
    const settings = STORE_SETTINGS.map(s => ({
      key: s.key,
      type: s.type,
      description: s.description,
      restartRequired: s.restartRequired,
      value: process.env[s.key] || '',
      ...(s.options ? { options: s.options } : {})
    }));
    res.json(settings);
  });

  router.post('/settings', authMiddleware, async (req, res) => {
    try {
      const updates = req.body;
      const envPath = '/app/.env';
      
      console.log('Saving settings to:', envPath);
      console.log('Updates:', JSON.stringify(updates));
      
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      } else {
        console.log('Warning: .env file does not exist, creating new one');
      }
      
      const envLines = envContent.split('\n');
      const envMap = {};
      envLines.forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          envMap[match[1].trim()] = match[2];
        }
      });
      
      Object.keys(updates).forEach(key => {
        envMap[key] = updates[key];
      });
      
      const newEnvContent = Object.entries(envMap)
        .filter(([key, value]) => key && value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      console.log('New .env content:', newEnvContent);
      fs.writeFileSync(envPath, newEnvContent);
      console.log('Settings saved successfully');
      
      // Clear cache so new settings take effect after restart
      cache.clear();
      
      // Also delete the cache file from persistent storage
      try {
        const cacheFile = '/app/.cache/cache.json';
        if (fs.existsSync(cacheFile)) {
          fs.unlinkSync(cacheFile);
          console.log('Cache file deleted');
        }
      } catch (e) {
        console.log('Could not delete cache file:', e.message);
      }
      
      Object.keys(updates).forEach(key => {
        process.env[key] = updates[key];
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving settings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Restart endpoint - triggers server full restart
  router.post('/restart', authMiddleware, (req, res) => {
    try {
      // Force process exit - Docker will restart the container due to restart: unless-stopped
      console.log('Restart triggered via admin API');
      res.json({ success: true, message: 'Restart triggered' });
      
      // Give time for response to be sent and cache to clear
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/store-config', authMiddleware, (req, res) => {
    res.json(getStoreConfig());
  });

  // Medusa Product Management
  router.get('/medusa/products', authMiddleware, async (req, res) => {
    try {
      const service = getMedusaService(req.session?.medusaToken);
      const products = await service.getProducts();
      res.json(products);
    } catch (error) {
      console.error('Error fetching Medusa products:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/medusa/products/:id', authMiddleware, async (req, res) => {
    try {
      const service = getMedusaService(req.session?.medusaToken);
      const product = await service.getProductById(req.params.id);
      res.json(product);
    } catch (error) {
      console.error('Error fetching Medusa product:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/medusa/products', authMiddleware, async (req, res) => {
    try {
      const service = getMedusaService(req.session?.medusaToken);
      
      const { variants, ...productData } = req.body;
      const inventoryQty = variants?.[0]?.inventory_quantity || 0;
      
      const productPayload = {
        title: productData.title,
        description: productData.description,
        status: productData.status,
        thumbnail: productData.thumbnail,
        options: [{ title: 'Default', values: ['Default'] }],
        variants: variants?.map((v) => ({
          title: v.title || 'Default',
          prices: v.prices,
          manage_inventory: true,
        })) || [{ 
          title: 'Default', 
          prices: [{ currency_code: 'usd', amount: 0 }], 
          manage_inventory: true,
        }],
      };
      
      const product = await service.createProduct(productPayload);
      
      // Create inventory item for first variant
      if (inventoryQty > 0 && product.product?.variants?.[0]?.id) {
        const variantId = product.product.variants[0].id;
        await service.createInventoryItem(variantId, `Inventory for ${productData.title}`, inventoryQty);
      }
      
      res.json(product);
    } catch (error) {
      console.error('Error creating Medusa product:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/medusa/products/:id', authMiddleware, async (req, res) => {
    try {
      const service = getMedusaService(req.session?.medusaToken);
      const product = await service.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error) {
      console.error('Error updating Medusa product:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/medusa/products/:id', authMiddleware, async (req, res) => {
    try {
      const service = getMedusaService(req.session?.medusaToken);
      await service.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting Medusa product:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update product variant
  router.post('/medusa/products/:productId/variants/:variantId', authMiddleware, async (req, res) => {
    try {
      const service = getMedusaService(req.session?.medusaToken);
      const { inventory_quantity, ...variantData } = req.body;
      
      // If inventory is being updated separately, just update variant data
      const variant = await service.updateVariant(req.params.productId, req.params.variantId, variantData);
      res.json(variant);
    } catch (error) {
      console.error('Error updating Medusa variant:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update product inventory
  router.post('/medusa/products/:productId/variants/:variantId/inventory', authMiddleware, async (req, res) => {
    try {
      const service = getMedusaService(req.session?.medusaToken);
      const { quantity } = req.body;
      const { variantId } = req.params;
      
      // Get existing inventory items for this variant
      const product = await service.getProductById(req.params.productId);
      const variant = product.variants?.find(v => v.id === variantId);
      
      if (variant?.inventory_items?.length > 0) {
        // Update existing inventory item
        const inventoryItemId = variant.inventory_items[0].id;
        const locations = await service.getStockLocations();
        const locationId = locations.stock_locations?.[0]?.id;
        
        if (locationId) {
          await service.updateInventoryLevel(inventoryItemId, locationId, quantity);
        }
      } else {
        // Create new inventory item and link to variant
        await service.createInventoryItem(variantId, `Inventory for variant ${variantId}`, quantity);
      }
      
      res.json({ success: true, quantity });
    } catch (error) {
      console.error('Error updating inventory:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get product inventory
  router.get('/medusa/products/:productId/variants/:variantId/inventory', authMiddleware, async (req, res) => {
    try {
      const service = getMedusaService(req.session?.medusaToken);
      
      // Get the product with variants
      const product = await service.getProductById(req.params.productId);
      const variant = product.variants?.find(v => v.id === req.params.variantId);
      
      if (variant) {
        res.json({ 
          stocked_quantity: variant.inventory_quantity || 0,
        });
      } else {
        res.json({ stocked_quantity: 0 });
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Medusa Orders
  router.get('/medusa/orders', authMiddleware, async (req, res) => {
    try {
      const service = getMedusaService(req.session?.medusaToken);
      const orders = await service.getOrders();
      res.json(orders);
    } catch (error) {
      console.error('Error fetching Medusa orders:', error);
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/medusa/orders/:id', authMiddleware, async (req, res) => {
    try {
      const service = getMedusaService(req.session?.medusaToken);
      const order = await service.getOrderById(req.params.id);
      res.json(order);
    } catch (error) {
      console.error('Error fetching Medusa order:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
