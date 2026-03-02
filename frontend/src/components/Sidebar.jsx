import { Link, useLocation } from 'react-router-dom';

function Sidebar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <Link to="/" className={`sidebar-link ${isActive('/')}`}>
          Home
        </Link>
        <Link to="/videos" className={`sidebar-link ${isActive('/videos')}`}>
          Videos
        </Link>
        <Link to="/shorts" className={`sidebar-link ${isActive('/shorts')}`}>
          Shorts
        </Link>
        <Link to="/live" className={`sidebar-link ${isActive('/live')}`}>
          Live
        </Link>
        <Link to="/posts" className={`sidebar-link ${isActive('/posts')}`}>
          Posts
        </Link>
        <Link to="/playlists" className={`sidebar-link ${isActive('/playlists')}`}>
          Playlists
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
