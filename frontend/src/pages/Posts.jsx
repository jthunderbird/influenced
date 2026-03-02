import { useState, useEffect } from 'react';
import { api } from '../services/api';

function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await api.getPosts();
        setPosts(data.items);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div>
      <h2 className="page-title">Community Posts</h2>
      {posts.length === 0 ? (
        <div className="no-content">No community posts found</div>
      ) : (
        <div>
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              <div className="post-type">{post.type}</div>
              {post.title && <h3 className="post-title">{post.title}</h3>}
              {post.description && (
                <p className="post-description">{post.description}</p>
              )}
              {post.thumbnail && (
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  style={{ width: '100%', borderRadius: '8px', marginTop: '12px' }}
                />
              )}
              <div className="post-date">{formatDate(post.publishedAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Posts;
