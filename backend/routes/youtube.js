const express = require('express');
const router = express.Router();

module.exports = (youtubeService, getChannelId) => {
  // Get channel information
  router.get('/channel', async (req, res) => {
    try {
      const channelInfo = await youtubeService.getChannelInfo(getChannelId());
      res.json(channelInfo);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get recent mixed content from all categories
  router.get('/recent', async (req, res) => {
    try {
      const recentContent = await youtubeService.getRecentMixed(getChannelId());
      res.json(recentContent);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get videos
  router.get('/videos', async (req, res) => {
    try {
      const { maxResults = 50, pageToken } = req.query;
      const videos = await youtubeService.getVideos(getChannelId(), maxResults, pageToken);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get shorts
  router.get('/shorts', async (req, res) => {
    try {
      const { maxResults = 50, pageToken } = req.query;
      const shorts = await youtubeService.getShorts(getChannelId(), maxResults, pageToken);
      res.json(shorts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get live streams
  router.get('/live', async (req, res) => {
    try {
      const { maxResults = 50, pageToken } = req.query;
      const liveStreams = await youtubeService.getLiveStreams(getChannelId(), maxResults, pageToken);
      res.json(liveStreams);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get community posts
  router.get('/posts', async (req, res) => {
    try {
      const { maxResults = 50, pageToken } = req.query;
      const posts = await youtubeService.getPosts(getChannelId(), maxResults, pageToken);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get playlists
  router.get('/playlists', async (req, res) => {
    try {
      const { maxResults = 50, pageToken } = req.query;
      const playlists = await youtubeService.getPlaylists(getChannelId(), maxResults, pageToken);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get videos from a specific playlist
  router.get('/playlist/:id', async (req, res) => {
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
  router.get('/search', async (req, res) => {
    try {
      const { q, maxResults = 20 } = req.query;
      if (!q) {
        return res.status(400).json({ error: 'Search query (q) is required' });
      }
      const searchResults = await youtubeService.searchChannel(getChannelId(), q, maxResults);
      res.json(searchResults);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
