import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import VideoGrid from '../components/VideoGrid';
import { api } from '../services/api';

function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await api.search(query);
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  if (!query) {
    return (
      <div>
        <h2 className="page-title">Search</h2>
        <div className="no-content">Enter a search query to find content</div>
      </div>
    );
  }

  if (loading) return <div className="loading">Searching...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const totalResults =
    (results?.videos?.length || 0) +
    (results?.shorts?.length || 0) +
    (results?.live?.length || 0) +
    (results?.playlists?.length || 0);

  return (
    <div>
      <h2 className="page-title">
        Search results for "{query}" ({totalResults} results)
      </h2>

      {results?.videos && results.videos.length > 0 && (
        <section className="search-section">
          <h3 className="search-section-title">Videos ({results.videos.length})</h3>
          <VideoGrid videos={results.videos} />
        </section>
      )}

      {results?.shorts && results.shorts.length > 0 && (
        <section className="search-section">
          <h3 className="search-section-title">Shorts ({results.shorts.length})</h3>
          <VideoGrid videos={results.shorts} />
        </section>
      )}

      {results?.live && results.live.length > 0 && (
        <section className="search-section">
          <h3 className="search-section-title">Live Streams ({results.live.length})</h3>
          <VideoGrid videos={results.live} />
        </section>
      )}

      {results?.playlists && results.playlists.length > 0 && (
        <section className="search-section">
          <h3 className="search-section-title">Playlists ({results.playlists.length})</h3>
          <div className="playlist-grid">
            {results.playlists.map((playlist) => (
              <div key={playlist.id} className="playlist-card">
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
        </section>
      )}

      {totalResults === 0 && (
        <div className="no-content">No results found for "{query}"</div>
      )}
    </div>
  );
}

export default Search;
