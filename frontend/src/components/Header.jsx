import { Link, useLocation } from 'react-router-dom';

function Header({ channelInfo }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

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
    </header>
  );
}

export default Header;
