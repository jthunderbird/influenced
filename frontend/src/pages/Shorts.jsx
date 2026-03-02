import { useState, useEffect } from 'react';
import VideoGrid from '../components/VideoGrid';
import { api } from '../services/api';

function Shorts() {
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [prevPageToken, setPrevPageToken] = useState(null);

  const fetchShorts = async (pageToken = null) => {
    setLoading(true);
    try {
      const data = await api.getShorts(pageToken);
      setShorts(data.items);
      setNextPageToken(data.nextPageToken);
      setPrevPageToken(data.prevPageToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div>
      <h2 className="page-title">Shorts</h2>
      <VideoGrid videos={shorts} />
      <div className="pagination">
        <button
          onClick={() => fetchShorts(prevPageToken)}
          disabled={!prevPageToken}
        >
          Previous
        </button>
        <button
          onClick={() => fetchShorts(nextPageToken)}
          disabled={!nextPageToken}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Shorts;
