import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Header({ channelInfo, theme, toggleTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const youtubeChannelUrl = channelInfo?.customUrl
    ? `https://www.youtube.com/${channelInfo.customUrl}`
    : channelInfo?.id
    ? `https://www.youtube.com/channel/${channelInfo.id}`
    : null;

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        {channelInfo?.avatar && (
          <img
            src={channelInfo.avatar}
            alt={channelInfo.title}
            className="header-avatar"
          />
        )}
        <h1 className="header-title">{channelInfo?.title || 'Channel'}</h1>
      </Link>
      <nav className="header-nav">
        <Link to="/" className={`nav-link ${isActive('/')}`}>
          Home
        </Link>
        <Link to="/videos" className={`nav-link ${isActive('/videos')}`}>
          Videos
        </Link>
        <Link to="/shorts" className={`nav-link ${isActive('/shorts')}`}>
          Shorts
        </Link>
        <Link to="/live" className={`nav-link ${isActive('/live')}`}>
          Live
        </Link>
        <Link to="/posts" className={`nav-link ${isActive('/posts')}`}>
          Posts
        </Link>
        <Link to="/playlists" className={`nav-link ${isActive('/playlists')}`}>
          Playlists
        </Link>
      </nav>
      <div className="header-actions">
        <button
          className="header-icon-btn"
          onClick={() => setShowSearch(!showSearch)}
          title="Search"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
        {youtubeChannelUrl && (
          <a
            href={youtubeChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="header-icon-btn"
            title="View on YouTube"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
        )}
        <button
          className="header-icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </div>
      {showSearch && (
        <div className="search-overlay">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search videos, shorts, live streams, and playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="search-input"
            />
            <button type="submit" className="search-submit">Search</button>
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="search-close"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </header>
  );
}

export default Header;
