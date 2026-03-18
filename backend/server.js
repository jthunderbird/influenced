require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const path = require('path');
const YouTubeService = require('./services/youtubeService');
const youtubeRoutes = require('./routes/youtube');
const adminRoutes = require('./routes/admin');
const storeRoutes = require('./routes/store');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware - only enable helmet in production if USE_HELMET is set
if (process.env.USE_HELMET === 'true') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://i.ytimg.com", "https://yt3.ggpht.com", "https://*.googlesyndication.com"],
        connectSrc: ["'self'", "https://www.googleapis.com"],
        frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com"],
        fontSrc: ["'self'"],
      },
    },
  }));
}

// CORS - enable for session/credentials support
if (process.env.ALLOWED_ORIGINS) {
  const corsOptions = {
    origin: function(origin, callback) {
      const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
      
      // Allow if origin matches exactly
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow if origin hostname matches (with or without protocol, supports subdomains)
      const originHostname = origin.replace(/^https?:\/\//, '');
      for (const allowed of allowedOrigins) {
        const allowedHostname = allowed.replace(/^https?:\/\//, '');
        if (originHostname === allowedHostname || originHostname.endsWith('.' + allowedHostname)) {
          return callback(null, true);
        }
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  };
  app.use(cors(corsOptions));
} else {
  // Allow all origins when ALLOWED_ORIGINS is not set (needed for session cookies)
  app.use(cors({ origin: true, credentials: true }));
}

// Rate limiting - only enable if USE_RATE_LIMIT is set
if (process.env.USE_RATE_LIMIT === 'true') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);
}

// Stripe webhook - must be before express.json() middleware
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('Stripe webhook error: STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).send('Webhook configuration error');
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment successful for session:', session.id);
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

// Middleware
app.use(express.json());

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'influenced-secret-key-change-in-production',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
};
app.use(session(sessionConfig));

// Environment variables validation
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_HANDLE = process.env.YOUTUBE_CHANNEL_HANDLE;

// Social media handles (optional) - read dynamically from process.env
const getSocialMedia = () => ({
  facebook: process.env.FACEBOOK_HANDLE || null,
  x: process.env.X_HANDLE || null,
  tiktok: process.env.TIKTOK_HANDLE || null,
  instagram: process.env.INSTAGRAM_HANDLE || null
});

// Recent content settings - read dynamically from process.env
const getRecentConfig = () => ({
  days: parseInt(process.env.RECENT_DAYS) || 7,
  videos: parseInt(process.env.RECENT_VIDEOS) || 10,
  shorts: parseInt(process.env.RECENT_SHORTS) || 10,
  live: parseInt(process.env.RECENT_LIVE) || 5,
  posts: parseInt(process.env.RECENT_POSTS) || 5,
  playlists: parseInt(process.env.RECENT_PLAYLISTS) || 5
});

if (!YOUTUBE_API_KEY) {
  console.error('Error: YOUTUBE_API_KEY environment variable is not set');
  process.exit(1);
}

if (!YOUTUBE_CHANNEL_HANDLE) {
  console.error('Error: YOUTUBE_CHANNEL_HANDLE environment variable is not set');
  process.exit(1);
}

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

// Initialize YouTube service
const youtubeService = new YouTubeService(YOUTUBE_API_KEY);
let channelId = null;

// Initialize channel ID
async function initializeChannel() {
  try {
    // Check if it's already a channel ID (starts with UC and is 24 chars)
    if (YOUTUBE_CHANNEL_HANDLE.startsWith('UC') && YOUTUBE_CHANNEL_HANDLE.length === 24) {
      console.log(`Using provided channel ID: ${YOUTUBE_CHANNEL_HANDLE}`);
      channelId = YOUTUBE_CHANNEL_HANDLE;
    } else {
      console.log(`Fetching channel ID for handle: ${YOUTUBE_CHANNEL_HANDLE}`);
      channelId = await youtubeService.getChannelIdFromHandle(YOUTUBE_CHANNEL_HANDLE);
      console.log(`Channel ID found: ${channelId}`);
    }
  } catch (error) {
    console.error('Error initializing channel:', error.message);
    process.exit(1);
  }
}

// Routes - pass a function to get channelId dynamically
app.use('/api', async (req, res, next) => {
  if (!channelId) {
    return res.status(503).json({ error: 'Service initializing, please wait...' });
  }
  next();
}, youtubeRoutes(youtubeService, () => channelId, getSocialMedia, getRecentConfig));

// Admin routes
app.use('/api/admin', adminRoutes());

// Store routes (requires store enabled)
app.use('/api/store', storeRoutes);

// Serve static files from React build (in production)
const buildPath = path.join(__dirname, 'frontend/dist');
app.use(express.static(buildPath));

// Serve React app for all other routes (must be before 404 handler)
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// 404 handler (only for API routes that don't match)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

const fs = require('fs');

// Start server
let server;

async function startServer() {
  await initializeChannel();

  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Channel: ${YOUTUBE_CHANNEL_HANDLE}`);
    
    // Watch for restart trigger file
    const restartFile = path.join(__dirname, '.restart');
    const restartMarker = path.join(__dirname, '.restart_marker');
    
    // Create the restart file if it doesn't exist
    if (!fs.existsSync(restartFile)) {
      fs.writeFileSync(restartFile, '');
    }
    
    fs.watch(restartFile, (eventType) => {
      if (eventType === 'change') {
        try {
          const content = fs.readFileSync(restartFile, 'utf8').trim();
          if (content === 'FULL_RESTART') {
            console.log('Full restart triggered, shutting down...');
            fs.writeFileSync(restartFile, '');
            if (server) {
              server.close(() => {
                console.log('Server closed, will restart...');
                process.exit(0);
              });
            }
          }
        } catch (e) {}
      }
    });
  });
}

startServer();
