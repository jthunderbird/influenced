const axios = require('axios');

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

class YouTubeService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async getChannelIdFromHandle(handle) {
    try {
      // Remove @ symbol if present
      const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;

      // Try forUsername first (works for legacy usernames)
      try {
        const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
          params: {
            part: 'id',
            forUsername: cleanHandle,
            key: this.apiKey
          }
        });

        if (response.data.items && response.data.items.length > 0) {
          return response.data.items[0].id;
        }
      } catch (err) {
        console.log('forUsername lookup failed, trying search...');
      }

      // Fall back to search if forUsername doesn't work
      const searchResponse = await axios.get(`${YOUTUBE_API_BASE}/search`, {
        params: {
          part: 'snippet',
          q: handle, // Use original handle with @ symbol
          type: 'channel',
          maxResults: 5,
          key: this.apiKey
        }
      });

      if (searchResponse.data.items && searchResponse.data.items.length > 0) {
        // Return the first result's channel ID (it's in id.channelId for search results)
        const foundChannelId = searchResponse.data.items[0].id.channelId;
        console.log(`Found channel ID via search: ${foundChannelId}`);
        return foundChannelId;
      }

      throw new Error('Channel not found');
    } catch (error) {
      if (error.response) {
        console.error('YouTube API Error:', error.response.status, error.response.data);
        throw new Error(`YouTube API Error: ${error.response.data.error?.message || error.message}`);
      }
      console.error('Error getting channel ID:', error.message);
      throw error;
    }
  }

  async getChannelInfo(channelId) {
    try {
      console.log(`Fetching channel info for ID: ${channelId}`);
      const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
        params: {
          part: 'snippet,statistics,brandingSettings',
          id: channelId,
          key: this.apiKey
        }
      });

      if (response.data.items && response.data.items.length > 0) {
        const channel = response.data.items[0];
        return {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          customUrl: channel.snippet.customUrl,
          avatar: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url,
          banner: channel.brandingSettings?.image?.bannerExternalUrl,
          subscriberCount: channel.statistics.subscriberCount,
          videoCount: channel.statistics.videoCount,
          viewCount: channel.statistics.viewCount
        };
      }

      throw new Error('Channel info not found');
    } catch (error) {
      if (error.response) {
        console.error('YouTube API Error (getChannelInfo):', error.response.status);
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
        throw new Error(`YouTube API Error: ${error.response.data.error?.message || error.message}`);
      }
      console.error('Error getting channel info:', error.message);
      throw error;
    }
  }

  async getVideos(channelId, maxResults = 50, pageToken = null) {
    try {
      const params = {
        part: 'snippet',
        channelId: channelId,
        type: 'video',
        order: 'date',
        maxResults: maxResults,
        key: this.apiKey
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await axios.get(`${YOUTUBE_API_BASE}/search`, { params });

      return {
        items: response.data.items.map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          publishedAt: item.snippet.publishedAt,
          channelTitle: item.snippet.channelTitle
        })),
        nextPageToken: response.data.nextPageToken,
        prevPageToken: response.data.prevPageToken
      };
    } catch (error) {
      if (error.response) {
        console.error('YouTube API Error (getVideos):', error.response.status);
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      console.error('Error getting videos:', error.message);
      throw error;
    }
  }

  async getShorts(channelId, maxResults = 50, pageToken = null) {
    try {
      // Note: YouTube API doesn't have a direct way to filter shorts
      // This is a workaround that gets videos and filters by duration
      const params = {
        part: 'snippet,contentDetails',
        channelId: channelId,
        type: 'video',
        order: 'date',
        maxResults: maxResults,
        videoDuration: 'short',
        key: this.apiKey
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await axios.get(`${YOUTUBE_API_BASE}/search`, { params });

      return {
        items: response.data.items.map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          publishedAt: item.snippet.publishedAt,
          channelTitle: item.snippet.channelTitle
        })),
        nextPageToken: response.data.nextPageToken,
        prevPageToken: response.data.prevPageToken
      };
    } catch (error) {
      console.error('Error getting shorts:', error.message);
      throw error;
    }
  }

  async getLiveStreams(channelId, maxResults = 50, pageToken = null) {
    try {
      const params = {
        part: 'snippet',
        channelId: channelId,
        type: 'video',
        eventType: 'live',
        maxResults: maxResults,
        key: this.apiKey
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await axios.get(`${YOUTUBE_API_BASE}/search`, { params });

      return {
        items: response.data.items.map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          publishedAt: item.snippet.publishedAt,
          channelTitle: item.snippet.channelTitle,
          isLive: true
        })),
        nextPageToken: response.data.nextPageToken,
        prevPageToken: response.data.prevPageToken
      };
    } catch (error) {
      console.error('Error getting live streams:', error.message);
      throw error;
    }
  }

  async getPosts(channelId, maxResults = 50, pageToken = null) {
    try {
      const params = {
        part: 'snippet,contentDetails',
        channelId: channelId,
        maxResults: maxResults,
        key: this.apiKey
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await axios.get(`${YOUTUBE_API_BASE}/activities`, { params });

      // Filter for community posts
      const posts = response.data.items.filter(item =>
        item.snippet.type === 'upload' ||
        item.snippet.type === 'playlistItem' ||
        item.snippet.type === 'social'
      );

      return {
        items: posts.map(item => ({
          id: item.id,
          type: item.snippet.type,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
          publishedAt: item.snippet.publishedAt
        })),
        nextPageToken: response.data.nextPageToken,
        prevPageToken: response.data.prevPageToken
      };
    } catch (error) {
      console.error('Error getting posts:', error.message);
      throw error;
    }
  }

  async getPlaylists(channelId, maxResults = 50, pageToken = null) {
    try {
      const params = {
        part: 'snippet,contentDetails',
        channelId: channelId,
        maxResults: maxResults,
        key: this.apiKey
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await axios.get(`${YOUTUBE_API_BASE}/playlists`, { params });

      return {
        items: response.data.items.map(item => ({
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          itemCount: item.contentDetails.itemCount,
          publishedAt: item.snippet.publishedAt
        })),
        nextPageToken: response.data.nextPageToken,
        prevPageToken: response.data.prevPageToken
      };
    } catch (error) {
      console.error('Error getting playlists:', error.message);
      throw error;
    }
  }

  async getPlaylistVideos(playlistId, maxResults = 50, pageToken = null) {
    try {
      const params = {
        part: 'snippet',
        playlistId: playlistId,
        maxResults: maxResults,
        key: this.apiKey
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const response = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, { params });

      return {
        items: response.data.items.map(item => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          publishedAt: item.snippet.publishedAt,
          channelTitle: item.snippet.channelTitle
        })),
        nextPageToken: response.data.nextPageToken,
        prevPageToken: response.data.prevPageToken
      };
    } catch (error) {
      console.error('Error getting playlist videos:', error.message);
      throw error;
    }
  }
}

module.exports = YouTubeService;
