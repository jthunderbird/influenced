import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import Videos from './pages/Videos';
import Shorts from './pages/Shorts';
import Live from './pages/Live';
import Posts from './pages/Posts';
import Playlists from './pages/Playlists';
import Search from './pages/Search';
import VideoPlayer from './components/VideoPlayer';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { api } from './services/api';

function App() {
  const [channelInfo, setChannelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => {
    // Check localStorage for saved theme preference, default to 'dark'
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const fetchChannelInfo = async () => {
      try {
        const data = await api.getChannel();
        setChannelInfo(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChannelInfo();
  }, []);

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Set page title based on channel name
    if (channelInfo?.title) {
      document.title = `${channelInfo.title} - influenced`;
    }
  }, [channelInfo]);

  useEffect(() => {
    // Set favicon to channel avatar
    if (channelInfo?.avatar) {
      const link = document.querySelector("link[rel~='icon']");
      if (link) {
        link.href = channelInfo.avatar;
      }
    }
  }, [channelInfo]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading channel information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>
        <div>Error: {error}</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Header channelInfo={channelInfo} theme={theme} toggleTheme={toggleTheme} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/shorts" element={<Shorts />} />
            <Route path="/live" element={<Live />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/search" element={<Search />} />
            <Route path="/watch/:videoId" element={<VideoPlayer />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
