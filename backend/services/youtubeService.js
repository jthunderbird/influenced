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

      // Get video IDs to fetch durations
      const videoIds = response.data.items.map(item => item.id.videoId).join(',');

      if (!videoIds) {
        return { items: [], nextPageToken: null, prevPageToken: null };
      }

      // Fetch video details including duration
      const detailsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
        params: {
          part: 'contentDetails',
          id: videoIds,
          key: this.apiKey
        }
      });

      // Create a map of video ID to duration
      const durationMap = {};
      detailsResponse.data.items.forEach(item => {
        durationMap[item.id] = this.formatDuration(item.contentDetails.duration);
      });

      return {
        items: response.data.items.map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          publishedAt: item.snippet.publishedAt,
          channelTitle: item.snippet.channelTitle,
          duration: durationMap[item.id.videoId]
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
      // We'll get videos and filter by duration (under 60 seconds)
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

      // Get video IDs to fetch durations
      const videoIds = response.data.items.map(item => item.id.videoId).join(',');

      if (!videoIds) {
        return { items: [], nextPageToken: null, prevPageToken: null };
      }

      // Fetch video details including duration
      const detailsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
        params: {
          part: 'contentDetails',
          id: videoIds,
          key: this.apiKey
        }
      });

      // Create a map of video ID to duration (both raw and formatted)
      const durationMap = {};
      detailsResponse.data.items.forEach(item => {
        durationMap[item.id] = {
          raw: item.contentDetails.duration,
          formatted: this.formatDuration(item.contentDetails.duration)
        };
      });

      // Filter for shorts (videos under 60 seconds) and add duration
      const shorts = response.data.items
        .map(item => {
          const durData = durationMap[item.id.videoId];
          return {
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
            publishedAt: item.snippet.publishedAt,
            channelTitle: item.snippet.channelTitle,
            duration: durData?.formatted
          };
        })
        .filter(video => {
          const durData = durationMap[video.id];
          if (!durData) return false;
          const duration = this.parseDuration(durData.raw);
          return duration <= 60;
        });

      return {
        items: shorts,
        nextPageToken: response.data.nextPageToken,
        prevPageToken: response.data.prevPageToken
      };
    } catch (error) {
      if (error.response) {
        console.error('YouTube API Error (getShorts):', error.response.status);
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
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

  async getRecentMixed(channelId) {
    try {
      // Fetch small amounts from each category
      const [videos, shorts, live, posts, playlists] = await Promise.allSettled([
        this.getVideos(channelId, 6),
        this.getShorts(channelId, 6),
        this.getLiveStreams(channelId, 3),
        this.getPosts(channelId, 4),
        this.getPlaylists(channelId, 4)
      ]);

      return {
        videos: videos.status === 'fulfilled' ? videos.value.items.slice(0, 6) : [],
        shorts: shorts.status === 'fulfilled' ? shorts.value.items.slice(0, 6) : [],
        live: live.status === 'fulfilled' ? live.value.items.slice(0, 3) : [],
        posts: posts.status === 'fulfilled' ? posts.value.items.slice(0, 4) : [],
        playlists: playlists.status === 'fulfilled' ? playlists.value.items.slice(0, 4) : []
      };
    } catch (error) {
      console.error('Error getting mixed recent content:', error.message);
      throw error;
    }
  }

  // Helper method to parse ISO 8601 duration to seconds
  parseDuration(duration) {
    if (!duration) return 0;

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  }

  // Helper method to format duration for display
  formatDuration(duration) {
    if (!duration) return '0:00';

    const totalSeconds = this.parseDuration(duration);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
}

module.exports = YouTubeService;
