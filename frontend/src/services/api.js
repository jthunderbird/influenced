import axios from 'axios';

const API_BASE = '/api';

export const api = {
  getChannel: async () => {
    const response = await axios.get(`${API_BASE}/channel`);
    return response.data;
  },

  getRecent: async () => {
    const response = await axios.get(`${API_BASE}/recent`);
    return response.data;
  },

  getVideos: async (pageToken = null) => {
    const params = pageToken ? { pageToken } : {};
    const response = await axios.get(`${API_BASE}/videos`, { params });
    return response.data;
  },

  getShorts: async (pageToken = null) => {
    const params = pageToken ? { pageToken } : {};
    const response = await axios.get(`${API_BASE}/shorts`, { params });
    return response.data;
  },

  getLive: async (pageToken = null) => {
    const params = pageToken ? { pageToken } : {};
    const response = await axios.get(`${API_BASE}/live`, { params });
    return response.data;
  },

  getPosts: async (pageToken = null) => {
    const params = pageToken ? { pageToken } : {};
    const response = await axios.get(`${API_BASE}/posts`, { params });
    return response.data;
  },

  getPlaylists: async (pageToken = null) => {
    const params = pageToken ? { pageToken } : {};
    const response = await axios.get(`${API_BASE}/playlists`, { params });
    return response.data;
  },

  getPlaylistVideos: async (playlistId, pageToken = null) => {
    const params = pageToken ? { pageToken } : {};
    const response = await axios.get(`${API_BASE}/playlist/${playlistId}`, { params });
    return response.data;
  },

  search: async (query) => {
    const response = await axios.get(`${API_BASE}/search`, { params: { q: query } });
    return response.data;
  }
};
