const fs = require('fs');
const path = require('path');

const CACHE_DIR = process.env.CACHE_DIR || path.join(__dirname, '../../.cache');

class Cache {
  constructor() {
    this.cache = new Map();
    this.cacheFile = path.join(CACHE_DIR, 'cache.json');
    this._init();
  }

  _init() {
    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, 'utf8');
        const parsed = JSON.parse(data);
        for (const [key, item] of Object.entries(parsed)) {
          this.cache.set(key, item);
        }
        console.log(`Cache loaded from ${this.cacheFile}`);
      }
    } catch (err) {
      console.error('Error initializing cache:', err.message);
    }
  }

  _save() {
    try {
      const data = {};
      for (const [key, item] of this.cache.entries()) {
        data[key] = item;
      }
      fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error saving cache:', err.message);
    }
  }

  set(key, value, ttlSeconds = 3600) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });
    this._save();
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this._save();
      return null;
    }

    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
    this._save();
  }

  clear() {
    this.cache.clear();
    this._save();
  }

  startCleanup(intervalSeconds = 60) {
    setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expiresAt) {
          this.cache.delete(key);
          changed = true;
        }
      }
      if (changed) {
        this._save();
      }
    }, intervalSeconds * 1000);
  }
}

module.exports = new Cache();
