const axios = require('axios');
const cache = require('./cache');

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

class YouTubeService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // Start cache cleanup on initialization
    cache.startCleanup(60); // Clean up every 60 seconds
  }

  async getChannelIdFromHandle(handle) {
    const cacheKey = `channel_handle_${handle}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT: channel ID for handle ${handle}`);
      return cached;
    }

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
          const channelId = response.data.items[0].id;
          // Cache for 7 days since channel IDs don't change often
          cache.set(cacheKey, channelId, 7 * 24 * 3600);
          return channelId;
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
        // Cache for 7 days
        cache.set(cacheKey, foundChannelId, 7 * 24 * 3600);
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
    const cacheKey = `channel_info_${channelId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT: channel info for ${channelId}`);
      return cached;
    }

    try {
      console.log(`Cache MISS: Fetching channel info for ID: ${channelId}`);
      const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
        params: {
          part: 'snippet,statistics,brandingSettings',
          id: channelId,
          key: this.apiKey
        }
      });

      if (response.data.items && response.data.items.length > 0) {
        const channel = response.data.items[0];
        const result = {
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
        // Cache for 60 minutes
        cache.set(cacheKey, result, 3600);
        return result;
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

  async getVideos(channelId, maxResults = 50, pageToken = null, bypassCache = false) {
    const cacheKey = `videos_${channelId}_${maxResults}_${pageToken || 'first'}`;
    
    // Debug: allow cache bypass via query param
    if (bypassCache) {
      cache.delete(cacheKey);
    }
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT: videos for ${channelId}`);
      return cached;
    }

    try {
      console.log(`Cache MISS: Fetching videos for ${channelId}`);
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

      // Fetch video details including duration and aspect ratio info
      const detailsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
        params: {
          part: 'contentDetails,player',
          id: videoIds,
          key: this.apiKey
        }
      });

      // Create a map of video ID to metadata
      const videoMetadataMap = {};
      detailsResponse.data.items.forEach(item => {
        const durationSeconds = this.parseDuration(item.contentDetails.duration);
        // YouTube Shorts criteria - be strict about 60 second limit
        // YouTube officially defines shorts as 60 seconds or less
        const hasShortsDuration = durationSeconds <= 60;
        const hasShortsUrl = item.player?.embedHtml && item.player.embedHtml.includes('/shorts/');
        const isShort = hasShortsDuration || hasShortsUrl;

        videoMetadataMap[item.id] = {
          raw: item.contentDetails.duration,
          formatted: this.formatDuration(item.contentDetails.duration),
          durationSeconds: durationSeconds,
          isShort: isShort
        };
      });

      // Filter out shorts - be conservative and exclude anything that might be a short
      // YouTube defines shorts as 60 seconds or less
      const videos = response.data.items
        .filter(item => {
          const metadata = videoMetadataMap[item.id.videoId];
          if (!metadata) {
            console.warn(`No metadata found for video ${item.id.videoId}, excluding from videos`);
            return false;
          }
          
          // Check if it's definitely a short (from embedHtml)
          const hasShortsUrl = item.player?.embedHtml && item.player.embedHtml.includes('/shorts/');
          
          // Conservative check: if embedHtml shows it's a short, exclude
          if (hasShortsUrl) {
            console.log(`Excluding short (embedHtml): ${item.snippet.title}`);
            return false;
          }
          
          // Also exclude if duration is 60 seconds or less
          // This catches shorts that might not have embedHtml set correctly
          if (metadata.durationSeconds <= 60) {
            console.log(`Excluding short (duration <= 60s): ${item.snippet.title} (${metadata.durationSeconds}s)`);
            return false;
          }
          
          return true;
        })
        .map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          publishedAt: item.snippet.publishedAt,
          channelTitle: item.snippet.channelTitle,
          duration: videoMetadataMap[item.id.videoId]?.formatted
        }));

      const result = {
        items: videos,
        nextPageToken: response.data.nextPageToken,
        prevPageToken: response.data.prevPageToken
      };
      // Cache for 60 minutes
      cache.set(cacheKey, result, 3600);
      return result;
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
    const cacheKey = `shorts_${channelId}_${maxResults}_${pageToken || 'first'}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT: shorts for ${channelId}`);
      return cached;
    }

    try {
      console.log(`Cache MISS: Fetching shorts for ${channelId}`);
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

      // Fetch video details including duration and format info
      const detailsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
        params: {
          part: 'contentDetails,player',
          id: videoIds,
          key: this.apiKey
        }
      });

      // Create a map of video ID to metadata
      const videoMetadataMap = {};
      detailsResponse.data.items.forEach(item => {
        const durationSeconds = this.parseDuration(item.contentDetails.duration);
        // YouTube Shorts criteria: same as in getVideos for consistency
        const hasShortsDuration = durationSeconds <= 60;
        const hasShortsUrl = item.player?.embedHtml && item.player.embedHtml.includes('/shorts/');
        const isShort = hasShortsDuration || hasShortsUrl;

        videoMetadataMap[item.id] = {
          raw: item.contentDetails.duration,
          formatted: this.formatDuration(item.contentDetails.duration),
          durationSeconds: durationSeconds,
          isShort: isShort
        };
      });

      // Filter for shorts - include videos that are definitely shorts
      const shorts = response.data.items
        .filter(item => {
          const metadata = videoMetadataMap[item.id.videoId];
          if (!metadata) return false;
          
          // Include if embedHtml shows it's a short
          const hasShortsUrl = item.player?.embedHtml && item.player.embedHtml.includes('/shorts/');
          if (hasShortsUrl) return true;
          
          // Include if duration is 60 seconds or less
          if (metadata.durationSeconds <= 60) return true;
          
          return false;
        })
        .map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          publishedAt: item.snippet.publishedAt,
          channelTitle: item.snippet.channelTitle,
          duration: videoMetadataMap[item.id.videoId]?.formatted
        }));

      const result = {
        items: shorts,
        nextPageToken: response.data.nextPageToken,
        prevPageToken: response.data.prevPageToken
      };
      // Cache for 60 minutes
      cache.set(cacheKey, result, 3600);
      return result;
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
    const cacheKey = `live_${channelId}_${maxResults}_${pageToken || 'first'}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT: live streams for ${channelId}`);
      return cached;
    }

    try {
      console.log(`Cache MISS: Fetching live streams for ${channelId}`);
      // Fetch both current live streams and completed broadcasts
      const liveParams = {
        part: 'snippet',
        channelId: channelId,
        type: 'video',
        eventType: 'live',
        maxResults: 25,
        key: this.apiKey
      };

      const completedParams = {
        part: 'snippet',
        channelId: channelId,
        type: 'video',
        eventType: 'completed',
        order: 'date',
        maxResults: Math.min(maxResults, 25),
        key: this.apiKey
      };

      if (pageToken) {
        completedParams.pageToken = pageToken;
      }

      // Fetch both in parallel
      const [liveResponse, completedResponse] = await Promise.allSettled([
        axios.get(`${YOUTUBE_API_BASE}/search`, { params: liveParams }),
        axios.get(`${YOUTUBE_API_BASE}/search`, { params: completedParams })
      ]);

      const liveItems = liveResponse.status === 'fulfilled'
        ? liveResponse.value.data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
            publishedAt: item.snippet.publishedAt,
            channelTitle: item.snippet.channelTitle,
            isLive: true,
            streamType: 'live'
          }))
        : [];

      const completedItems = completedResponse.status === 'fulfilled'
        ? completedResponse.value.data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
            publishedAt: item.snippet.publishedAt,
            channelTitle: item.snippet.channelTitle,
            isLive: false,
            streamType: 'past'
          }))
        : [];

      // Combine: live streams first, then past broadcasts
      const allStreams = [...liveItems, ...completedItems];

      const result = {
        items: allStreams,
        nextPageToken: completedResponse.status === 'fulfilled' ? completedResponse.value.data.nextPageToken : null,
        prevPageToken: completedResponse.status === 'fulfilled' ? completedResponse.value.data.prevPageToken : null
      };
      // Cache for 60 minutes
      cache.set(cacheKey, result, 3600);
      return result;
    } catch (error) {
      if (error.response) {
        console.error('YouTube API Error (getLiveStreams):', error.response.status);
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      console.error('Error getting live streams:', error.message);
      throw error;
    }
  }

  async getPosts(channelId, maxResults = 50, pageToken = null) {
    const cacheKey = `posts_${channelId}_${maxResults}_${pageToken || 'first'}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT: posts for ${channelId}`);
      return cached;
    }

    try {
      console.log(`Cache MISS: Fetching posts for ${channelId}`);
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

      // NOTE: YouTube's Data API v3 often does not provide community posts
      // even when they exist on the channel. This is a known API limitation.
      // We filter for 'social', 'bulletin', and 'channelItem' types, but
      // many channels will have 0 results even with active community posts.
      const posts = response.data.items.filter(item => {
        const type = item.snippet.type;
        return type === 'social' ||
               type === 'bulletin' ||
               type === 'channelItem';
      });

      const result = {
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
      // Cache for 60 minutes (posts don't change often)
      cache.set(cacheKey, result, 3600);
      return result;
    } catch (error) {
      if (error.response) {
        console.error('YouTube API Error (getPosts):', error.response.status);
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      console.error('Error getting posts:', error.message);
      throw error;
    }
  }

  async getPlaylists(channelId, maxResults = 50, pageToken = null) {
    const cacheKey = `playlists_${channelId}_${maxResults}_${pageToken || 'first'}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT: playlists for ${channelId}`);
      return cached;
    }

    try {
      console.log(`Cache MISS: Fetching playlists for ${channelId}`);
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

      const result = {
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
      // Cache for 60 minutes (playlists don't change often)
      cache.set(cacheKey, result, 3600);
      return result;
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

  async getRecentMixed(channelId, config = {}) {
    const {
      days = 7,
      videos: videoLimit = 10,
      shorts: shortLimit = 10,
      live: liveLimit = 5,
      posts: postLimit = 5,
      playlists: playlistLimit = 5
    } = config;
    
    const cacheKey = `recent_mixed_${channelId}_${days}_${videoLimit}_${shortLimit}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT: recent mixed content for ${channelId} (${days} days)`);
      return cached;
    }

    try {
      console.log(`Cache MISS: Fetching recent mixed content for ${channelId} (${days} days)`);
      
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffISO = cutoffDate.toISOString();

      // Fetch more content to filter by date
      const [videos, shorts, live, posts, playlists] = await Promise.allSettled([
        this.getVideos(channelId, 50),
        this.getShorts(channelId, 50),
        this.getLiveStreams(channelId, 10),
        this.getPosts(channelId, 20),
        this.getPlaylists(channelId, 10)
      ]);

      // Helper to filter items by date
      const filterByDate = (items) => {
        return items.filter(item => item.publishedAt >= cutoffISO);
      };

      // Helper to slice and limit
      const limitItems = (items, max) => items.slice(0, max);

      const result = {
        videos: videos.status === 'fulfilled' ? limitItems(filterByDate(videos.value.items), videoLimit) : [],
        shorts: shorts.status === 'fulfilled' ? limitItems(filterByDate(shorts.value.items), shortLimit) : [],
        live: live.status === 'fulfilled' ? limitItems(filterByDate(live.value.items), liveLimit) : [],
        posts: posts.status === 'fulfilled' ? limitItems(filterByDate(posts.value.items), postLimit) : [],
        playlists: playlists.status === 'fulfilled' ? limitItems(filterByDate(playlists.value.items), playlistLimit) : []
      };
      // Cache for 60 minutes
      cache.set(cacheKey, result, 3600);
      return result;
    } catch (error) {
      console.error('Error getting mixed recent content:', error.message);
      throw error;
    }
  }

  async searchChannel(channelId, query, maxResults = 20) {
    const cacheKey = `search_${channelId}_${query}_${maxResults}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache HIT: search for "${query}" in ${channelId}`);
      return cached;
    }

    try {
      console.log(`Cache MISS: Searching for "${query}" in ${channelId}`);
      // Search for videos and shorts
      const videoSearchParams = {
        part: 'snippet',
        channelId: channelId,
        q: query,
        type: 'video',
        maxResults: maxResults,
        key: this.apiKey
      };

      const videoSearchResponse = await axios.get(`${YOUTUBE_API_BASE}/search`, {
        params: videoSearchParams
      });

      // Get video IDs to fetch durations and classify as videos/shorts
      const videoIds = videoSearchResponse.data.items.map(item => item.id.videoId).join(',');

      let videos = [];
      let shorts = [];

      if (videoIds) {
        const detailsResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
          params: {
            part: 'contentDetails,player',
            id: videoIds,
            key: this.apiKey
          }
        });

        const videoMetadataMap = {};
        detailsResponse.data.items.forEach(item => {
          const durationSeconds = this.parseDuration(item.contentDetails.duration);
          const hasShortsDuration = durationSeconds <= 60;
          const hasShortsUrl = item.player?.embedHtml && item.player.embedHtml.includes('/shorts/');
          const isShort = hasShortsDuration || hasShortsUrl;

          videoMetadataMap[item.id] = {
            formatted: this.formatDuration(item.contentDetails.duration),
            isShort: isShort
          };
        });

        // Separate videos and shorts
        videoSearchResponse.data.items.forEach(item => {
          const metadata = videoMetadataMap[item.id.videoId];
          if (!metadata) return;

          const videoData = {
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
            publishedAt: item.snippet.publishedAt,
            channelTitle: item.snippet.channelTitle,
            duration: metadata.formatted
          };

          if (metadata.isShort) {
            shorts.push(videoData);
          } else {
            videos.push(videoData);
          }
        });
      }

      // Search for playlists
      const playlistSearchParams = {
        part: 'snippet',
        channelId: channelId,
        q: query,
        type: 'playlist',
        maxResults: 10,
        key: this.apiKey
      };

      const playlistSearchResponse = await axios.get(`${YOUTUBE_API_BASE}/search`, {
        params: playlistSearchParams
      });

      // Get playlist details for item counts
      const playlistIds = playlistSearchResponse.data.items.map(item => item.id.playlistId).join(',');
      let playlists = [];

      if (playlistIds) {
        const playlistDetailsResponse = await axios.get(`${YOUTUBE_API_BASE}/playlists`, {
          params: {
            part: 'snippet,contentDetails',
            id: playlistIds,
            key: this.apiKey
          }
        });

        playlists = playlistDetailsResponse.data.items.map(item => ({
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          itemCount: item.contentDetails.itemCount,
          publishedAt: item.snippet.publishedAt
        }));
      }

      // Search for live/completed streams with query
      const liveSearchParams = {
        part: 'snippet',
        channelId: channelId,
        q: query,
        type: 'video',
        eventType: 'completed',
        maxResults: 10,
        key: this.apiKey
      };

      const liveSearchResponse = await axios.get(`${YOUTUBE_API_BASE}/search`, {
        params: liveSearchParams
      });

      const liveStreams = liveSearchResponse.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle,
        isLive: false,
        streamType: 'past'
      }));

      const result = {
        videos,
        shorts,
        live: liveStreams,
        playlists
      };
      // Cache search results for 5 minutes
      cache.set(cacheKey, result, 3600);
      return result;
    } catch (error) {
      if (error.response) {
        console.error('YouTube API Error (searchChannel):', error.response.status);
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      console.error('Error searching channel:', error.message);
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
