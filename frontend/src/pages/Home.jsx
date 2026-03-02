import { useState, useEffect } from 'react';
import VideoGrid from '../components/VideoGrid';
import { api } from '../services/api';

function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await api.getVideos();
        setVideos(data.items.slice(0, 12)); // Show most recent 12 videos
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div>
      <h2 className="page-title">Recent Videos</h2>
      <VideoGrid videos={videos} />
    </div>
  );
}

export default Home;
