import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VideoGrid from '../components/VideoGrid';
import HorizontalVideoScroll from '../components/HorizontalVideoScroll';
import { api } from '../services/api';

function Home() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await api.getRecent();
        setContent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="home-page">
      {content?.videos && content.videos.length > 0 && (
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Recent Videos</h2>
            <Link to="/videos" className="section-link">View all</Link>
          </div>
          <HorizontalVideoScroll videos={content.videos} />
        </section>
      )}

      {content?.shorts && content.shorts.length > 0 && (
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Recent Shorts</h2>
            <Link to="/shorts" className="section-link">View all</Link>
          </div>
          <HorizontalVideoScroll videos={content.shorts} />
        </section>
      )}

      {content?.live && content.live.length > 0 && (
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Live Streams</h2>
            <Link to="/live" className="section-link">View all</Link>
          </div>
          <HorizontalVideoScroll videos={content.live} />
        </section>
      )}

      {content?.posts && content.posts.length > 0 && (
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Recent Posts</h2>
            <Link to="/posts" className="section-link">View all</Link>
          </div>
          <div className="posts-preview">
            {content.posts.map((post) => (
              <div key={post.id} className="post-preview-card">
                <div className="post-type">{post.type}</div>
                {post.title && <h3 className="post-preview-title">{post.title}</h3>}
                {post.description && (
                  <p className="post-preview-description">
                    {post.description.substring(0, 100)}
                    {post.description.length > 100 ? '...' : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {content?.playlists && content.playlists.length > 0 && (
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Playlists</h2>
            <Link to="/playlists" className="section-link">View all</Link>
          </div>
          <div className="playlist-grid">
            {content.playlists.map((playlist) => (
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
    </div>
  );
}

export default Home;
