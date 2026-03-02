import { useState, useEffect } from 'react';
import VideoGrid from '../components/VideoGrid';
import { api } from '../services/api';

function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [prevPageToken, setPrevPageToken] = useState(null);

  const fetchVideos = async (pageToken = null) => {
    setLoading(true);
    try {
      const data = await api.getVideos(pageToken);
      setVideos(data.items);
      setNextPageToken(data.nextPageToken);
      setPrevPageToken(data.prevPageToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div>
      <h2 className="page-title">All Videos</h2>
      <VideoGrid videos={videos} />
      <div className="pagination">
        <button
          onClick={() => fetchVideos(prevPageToken)}
          disabled={!prevPageToken}
        >
          Previous
        </button>
        <button
          onClick={() => fetchVideos(nextPageToken)}
          disabled={!nextPageToken}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Videos;
