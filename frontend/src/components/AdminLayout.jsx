import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminLayout.css';

function AdminLayout({ children }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      title: 'YouTube Settings',
      items: [
        { path: '/admin', label: 'Channel Config', icon: 'settings' },
        { path: '/admin/social', label: 'Social Media', icon: 'share' },
        { path: '/admin/content', label: 'Content Settings', icon: 'video' },
      ]
    },
    {
      title: 'Store Settings',
      items: [
        { path: '/admin/store', label: 'Store Config', icon: 'store' },
        { path: '/admin/products', label: 'Products', icon: 'package' },
        { path: '/admin/orders', label: 'Orders', icon: 'shopping-cart' },
      ]
    },
    {
      title: 'Sync',
      items: [
        { path: '/admin/sync', label: 'External Sync', icon: 'refresh' },
      ]
    }
  ];

  const getIcon = (icon) => {
    switch (icon) {
      case 'settings':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M1 12h6m6 0h6M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24"/>
          </svg>
        );
      case 'share':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        );
      case 'video':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        );
      case 'store':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        );
      case 'package':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        );
      case 'folder':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        );
      case 'shopping-cart':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        );
      case 'refresh':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <button 
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? (
                <polyline points="9 18 15 12 9 6"/>
              ) : (
                <polyline points="15 18 9 12 15 6"/>
              )}
            </svg>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map((section, idx) => (
            <div key={idx} className="nav-section">
              {!collapsed && <h3 className="nav-section-title">{section.title}</h3>}
              <ul className="nav-section-items">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <Link 
                      to={item.path} 
                      className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                      title={collapsed ? item.label : ''}
                    >
                      {getIcon(item.icon)}
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="nav-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            {!collapsed && <span>Back to Site</span>}
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
