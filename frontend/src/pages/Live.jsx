import { useState, useEffect } from 'react';
import VideoGrid from '../components/VideoGrid';
import { api } from '../services/api';

function Live() {
  const [liveStreams, setLiveStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const data = await api.getLive();
        setLiveStreams(data.items);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLive();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div>
      <h2 className="page-title">Live Streams</h2>
      {liveStreams.length === 0 ? (
        <div className="no-content">No live streams at the moment</div>
      ) : (
        <VideoGrid videos={liveStreams} />
      )}
    </div>
  );
}

export default Live;
