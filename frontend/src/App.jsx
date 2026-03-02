import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import Videos from './pages/Videos';
import Shorts from './pages/Shorts';
import Live from './pages/Live';
import Posts from './pages/Posts';
import Playlists from './pages/Playlists';
import VideoPlayer from './components/VideoPlayer';
import { api } from './services/api';

function App() {
  const [channelInfo, setChannelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <Header channelInfo={channelInfo} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/shorts" element={<Shorts />} />
            <Route path="/live" element={<Live />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/watch/:videoId" element={<VideoPlayer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
