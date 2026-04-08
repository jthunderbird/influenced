import { useState, useEffect } from 'react';
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
  if (!content) return <div className="loading">No content</div>;

  const hasVideos = content.videos && content.videos.length > 0;
  const hasShorts = content.shorts && content.shorts.length > 0;
  const hasLive = content.live && content.live.length > 0;
  const hasPosts = content.posts && content.posts.length > 0;
  const hasPlaylists = content.playlists && content.playlists.length > 0;

  if (!hasVideos && !hasShorts && !hasLive && !hasPosts && !hasPlaylists) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>No recent content available.</p>
        <p>Check the Videos, Shorts, or Posts pages for more content.</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {hasVideos && (
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Recent Videos</h2>
            <a href="/videos" className="section-link">View all</a>
          </div>
          <HorizontalVideoScroll videos={content.videos} />
        </section>
      )}

      {hasShorts && (
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Recent Shorts</h2>
            <a href="/shorts" className="section-link">View all</a>
          </div>
          <HorizontalVideoScroll videos={content.shorts} />
        </section>
      )}

      {hasLive && (
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Live Streams</h2>
            <a href="/live" className="section-link">View all</a>
          </div>
          <HorizontalVideoScroll videos={content.live} />
        </section>
      )}

      {hasPosts && (
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Recent Posts</h2>
            <a href="/posts" className="section-link">View all</a>
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

      {hasPlaylists && (
        <section className="content-section">
          <div className="section-header">
            <h2 className="section-title">Playlists</h2>
            <a href="/playlists" className="section-link">View all</a>
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
