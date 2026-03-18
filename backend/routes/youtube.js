const express = require('express');
const { query, param } = require('express-validator');
const router = express.Router();

module.exports = (youtubeService, getChannelId, getSocialMedia, getRecentDays) => {
  // Validation middleware
  const validateQuery = (validations) => [
    ...validations,
    (req, res, next) => {
      const errors = require('express-validator').validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  ];

  // Get channel information
  router.get('/channel', async (req, res) => {
    try {
      const channelInfo = await youtubeService.getChannelInfo(getChannelId());
      const socialMedia = getSocialMedia();
      res.json({ ...channelInfo, socialMedia });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get channel avatar for favicon
  router.get('/channel/avatar', async (req, res) => {
    try {
      const channelInfo = await youtubeService.getChannelInfo(getChannelId());
      if (channelInfo && channelInfo.avatar) {
        return res.redirect(channelInfo.avatar);
      }
      res.status(404).json({ error: 'No avatar found' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get recent mixed content from all categories
  router.get('/recent', async (req, res) => {
    try {
      const recentConfig = getRecentDays();
      const recentContent = await youtubeService.getRecentMixed(getChannelId(), recentConfig);
      res.json(recentContent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get videos
  router.get('/videos', 
    validateQuery([
      query('maxResults').optional().isInt({ min: 1, max: 50 }).toInt(),
      query('pageToken').optional().isString().trim(),
      query('refresh').optional().isBoolean()
    ]),
    async (req, res) => {
    try {
      const { maxResults = 50, pageToken, refresh } = req.query;
      const videos = await youtubeService.getVideos(getChannelId(), maxResults, pageToken, refresh === 'true');
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get shorts
  router.get('/shorts', 
    validateQuery([
      query('maxResults').optional().isInt({ min: 1, max: 50 }).toInt(),
      query('pageToken').optional().isString().trim()
    ]),
    async (req, res) => {
    try {
      const { maxResults = 50, pageToken } = req.query;
      const shorts = await youtubeService.getShorts(getChannelId(), maxResults, pageToken);
      res.json(shorts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get live streams
  router.get('/live', 
    validateQuery([
      query('maxResults').optional().isInt({ min: 1, max: 50 }).toInt(),
      query('pageToken').optional().isString().trim()
    ]),
    async (req, res) => {
    try {
      const { maxResults = 50, pageToken } = req.query;
      const liveStreams = await youtubeService.getLiveStreams(getChannelId(), maxResults, pageToken);
      res.json(liveStreams);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get community posts
  router.get('/posts', 
    validateQuery([
      query('maxResults').optional().isInt({ min: 1, max: 50 }).toInt(),
      query('pageToken').optional().isString().trim()
    ]),
    async (req, res) => {
    try {
      const { maxResults = 50, pageToken } = req.query;
      const posts = await youtubeService.getPosts(getChannelId(), maxResults, pageToken);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get playlists
  router.get('/playlists', 
    validateQuery([
      query('maxResults').optional().isInt({ min: 1, max: 50 }).toInt(),
      query('pageToken').optional().isString().trim()
    ]),
    async (req, res) => {
    try {
      const { maxResults = 50, pageToken } = req.query;
      const playlists = await youtubeService.getPlaylists(getChannelId(), maxResults, pageToken);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get videos from a specific playlist
  router.get('/playlist/:id', 
    validateQuery([
      param('id').isString().trim().notEmpty().withMessage('Playlist ID is required'),
      query('maxResults').optional().isInt({ min: 1, max: 50 }).toInt(),
      query('pageToken').optional().isString().trim()
    ]),
    async (req, res) => {
    try {
      const { maxResults = 50, pageToken } = req.query;
      const playlistVideos = await youtubeService.getPlaylistVideos(
        req.params.id,
        maxResults,
        pageToken
      );
      res.json(playlistVideos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Search channel content
  router.get('/search', 
    validateQuery([
      query('q').isString().trim().notEmpty().isLength({ min: 1, max: 100 }).withMessage('Search query is required'),
      query('maxResults').optional().isInt({ min: 1, max: 50 }).toInt()
    ]),
    async (req, res) => {
    try {
      const { q, maxResults = 20 } = req.query;
      const searchResults = await youtubeService.searchChannel(getChannelId(), q, maxResults);
      res.json(searchResults);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
