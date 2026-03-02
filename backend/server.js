require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const YouTubeService = require('./services/youtubeService');
const youtubeRoutes = require('./routes/youtube');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables validation
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_HANDLE = process.env.YOUTUBE_CHANNEL_HANDLE;

if (!YOUTUBE_API_KEY) {
  console.error('Error: YOUTUBE_API_KEY environment variable is not set');
  process.exit(1);
}

if (!YOUTUBE_CHANNEL_HANDLE) {
  console.error('Error: YOUTUBE_CHANNEL_HANDLE environment variable is not set');
  process.exit(1);
}

// Initialize YouTube service
const youtubeService = new YouTubeService(YOUTUBE_API_KEY);
let channelId = null;

// Initialize channel ID
async function initializeChannel() {
  try {
    console.log(`Fetching channel ID for handle: ${YOUTUBE_CHANNEL_HANDLE}`);
    channelId = await youtubeService.getChannelIdFromHandle(YOUTUBE_CHANNEL_HANDLE);
    console.log(`Channel ID found: ${channelId}`);
  } catch (error) {
    console.error('Error initializing channel:', error.message);
    process.exit(1);
  }
}

// Routes
app.use('/api', async (req, res, next) => {
  if (!channelId) {
    return res.status(503).json({ error: 'Service initializing, please wait...' });
  }
  next();
}, youtubeRoutes(youtubeService, channelId));

// Serve static files from React build (in production)
const buildPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(buildPath));

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Start server
async function startServer() {
  await initializeChannel();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Channel: ${YOUTUBE_CHANNEL_HANDLE}`);
  });
}

startServer();
