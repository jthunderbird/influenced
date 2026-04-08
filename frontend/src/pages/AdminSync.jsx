import AdminLayout from '../components/AdminLayout';

function AdminSync() {
  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-header">
          <h1>External Sync</h1>
        </div>
        
        <div className="placeholder-card">
          <h3>Shopify & BigCommerce Integration</h3>
          <p>
            Connect your Shopify or BigCommerce store to automatically sync products and orders.
            Configure sync settings in Channel Configuration.
          </p>
          <div className="sync-features">
            <div className="feature">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              <div>
                <strong>Automatic Sync</strong>
                <p>Products and orders sync on a schedule you choose</p>
              </div>
            </div>
            <div className="feature">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              <div>
                <strong>Product Sync</strong>
                <p>Sync products, images, prices, and inventory</p>
              </div>
            </div>
            <div className="feature">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <div>
                <strong>Order Sync</strong>
                <p>Orders from this store appear in Shopify/BigCommerce</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .placeholder-card {
          padding: 32px;
          background: var(--bg-secondary);
          border-radius: 8px;
        }
        
        .placeholder-card h3 {
          margin-bottom: 12px;
        }
        
        .placeholder-card > p {
          color: var(--text-secondary);
          margin-bottom: 32px;
        }
        
        .sync-features {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .feature {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: var(--bg-tertiary);
          border-radius: 8px;
        }
        
        .feature svg {
          flex-shrink: 0;
          color: var(--text-secondary);
        }
        
        .feature strong {
          display: block;
          margin-bottom: 4px;
        }
        
        .feature p {
          color: var(--text-secondary);
          font-size: 14px;
          margin: 0;
        }
      `}</style>
    </AdminLayout>
  );
}

export default AdminSync;
