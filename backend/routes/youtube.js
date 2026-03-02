const express = require('express');
const router = express.Router();

module.exports = (youtubeService, channelId) => {
  // Get channel information
  router.get('/channel', async (req, res) => {
    try {
      const channelInfo = await youtubeService.getChannelInfo(channelId);
      res.json(channelInfo);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get videos
  router.get('/videos', async (req, res) => {
    try {
      const { maxResults = 50, pageToken } = req.query;
      const videos = await youtubeService.getVideos(channelId, maxResults, pageToken);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get shorts
  router.get('/shorts', async (req, res) => {
    try {
      const { maxResults = 50, pageToken } = req.query;
      const shorts = await youtubeService.getShorts(channelId, maxResults, pageToken);
      res.json(shorts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get live streams
  router.get('/live', async (req, res) => {
    try {
      const { maxResults = 50, pageToken } = req.query;
      const liveStreams = await youtubeService.getLiveStreams(channelId, maxResults, pageToken);
      res.json(liveStreams);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get community posts
  router.get('/posts', async (req, res) => {
    try {
      const { maxResults = 50, pageToken } = req.query;
      const posts = await youtubeService.getPosts(channelId, maxResults, pageToken);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get playlists
  router.get('/playlists', async (req, res) => {
    try {
      const { maxResults = 50, pageToken } = req.query;
      const playlists = await youtubeService.getPlaylists(channelId, maxResults, pageToken);
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

  return router;
};
