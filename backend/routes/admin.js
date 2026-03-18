const express = require('express');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const cache = require('../services/cache');

const router = express.Router();

const CONFIGURABLE_SETTINGS = [
  { key: 'YOUTUBE_API_KEY', type: 'text', description: 'Your YouTube Data API v3 key from Google Cloud Console', restartRequired: true },
  { key: 'YOUTUBE_CHANNEL_HANDLE', type: 'text', description: 'YouTube channel handle (e.g., @username or channel ID starting with UC)', restartRequired: true },
  { key: 'FACEBOOK_HANDLE', type: 'text', description: 'Facebook username without @', restartRequired: false },
  { key: 'X_HANDLE', type: 'text', description: 'X/Twitter username without @', restartRequired: false },
  { key: 'TIKTOK_HANDLE', type: 'text', description: 'TikTok username without @', restartRequired: false },
  { key: 'INSTAGRAM_HANDLE', type: 'text', description: 'Instagram username without @', restartRequired: false },
  { key: 'RECENT_DAYS', type: 'number', description: 'Number of days to look back for recent content on home page', restartRequired: false },
  { key: 'RECENT_VIDEOS', type: 'number', description: 'Maximum number of recent videos to display on home page', restartRequired: false },
  { key: 'RECENT_SHORTS', type: 'number', description: 'Maximum number of recent shorts to display on home page', restartRequired: false },
  { key: 'ALLOWED_ORIGINS', type: 'text', description: 'Comma-separated list of allowed CORS origins (leave empty to allow all)', restartRequired: false },
  { key: 'ADMIN_USERNAME', type: 'text', description: 'Username for admin panel login', restartRequired: true },
  { key: 'ADMIN_PASSWORD', type: 'password', description: 'Password for admin panel login', restartRequired: true },
  { key: 'USE_HELMET', type: 'boolean', description: 'Enable security headers (helmet.js)', restartRequired: false },
  { key: 'USE_RATE_LIMIT', type: 'boolean', description: 'Enable API rate limiting', restartRequired: false },
];

module.exports = () => {
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const adminUser = process.env.ADMIN_USERNAME || 'admin';
      const adminPass = process.env.ADMIN_PASSWORD || 'Password!123';
      
      if (username === adminUser && password === adminPass) {
        req.session.authenticated = true;
        req.session.username = username;
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

  return router;
};
