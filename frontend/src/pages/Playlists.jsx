import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const data = await api.getPlaylists();
        setPlaylists(data.items);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const handlePlaylistClick = (playlistId) => {
    // For now, we'll just navigate to the first video in the playlist
    // You could create a dedicated playlist page later
    navigate(`/playlists/${playlistId}`);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div>
      <h2 className="page-title">Playlists</h2>
      {playlists.length === 0 ? (
        <div className="no-content">No playlists found</div>
      ) : (
        <div className="playlist-grid">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="playlist-card"
              onClick={() => handlePlaylistClick(playlist.id)}
            >
              <img
                src={playlist.thumbnail}
                alt={playlist.title}
                className="playlist-thumbnail"
              />
              <div className="playlist-info">
                <h3 className="playlist-title">{playlist.title}</h3>
                <p className="playlist-count">{playlist.itemCount} videos</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Playlists;
