import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import AdminLayout from '../components/AdminLayout';

function AdminStoreConfig() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changedSettings, setChangedSettings] = useState({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await adminApi.getStoreSettings();
      setSettings(data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/admin/login');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setChangedSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.saveSettings(changedSettings);
      
      const needsRestart = settings.some(s => 
        changedSettings[s.key] !== undefined && 
        s.restartRequired
      );
      
      if (needsRestart) {
        setSuccess('Updating...');
        await adminApi.restart();
        await new Promise(resolve => setTimeout(resolve, 2000));
        window.location.reload();
      } else {
        setSuccess('Settings saved successfully!');
        setChangedSettings({});
        setTimeout(() => setSuccess(''), 3000);
        fetchSettings();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setChangedSettings({});
    fetchSettings();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Loading...</div>
      </AdminLayout>
    );
  }

  const hasChanges = Object.keys(changedSettings).length > 0;
  const storeEnabled = changedSettings['STORE_ENABLED'] !== undefined 
    ? changedSettings['STORE_ENABLED'] 
    : settings.find(s => s.key === 'STORE_ENABLED')?.value === true || 
      settings.find(s => s.key === 'STORE_ENABLED')?.value === 'true';

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-header">
          <h1>Store Configuration</h1>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className={`store-status-card ${storeEnabled ? 'enabled' : 'disabled'}`}>
          <div className="store-status-info">
            <h3>Store Status</h3>
            <p>
              The store is currently <strong>{storeEnabled ? 'enabled' : 'disabled'}</strong>.
              {storeEnabled 
                ? ' Customers can browse and purchase products.'
                : ' Enable the store below to start selling.'}
            </p>
          </div>
          <div className="store-status-indicator">
            {storeEnabled ? 'Active' : 'Inactive'}
          </div>
        </div>

        <div className="settings-grid">
          {settings.map(setting => (
            <div key={setting.key} className="setting-item">
              <label>
                {setting.key.replace(/_/g, ' ')}
                {setting.restartRequired && <span className="restart-badge">Restart required</span>}
              </label>
              <p className="setting-description">{setting.description}</p>
              {setting.type === 'boolean' ? (
                <select
                  value={changedSettings[setting.key] !== undefined 
                    ? changedSettings[setting.key] 
                    : setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value === 'true')}
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              ) : setting.type === 'select' && setting.options ? (
                <select
                  value={changedSettings[setting.key] !== undefined 
                    ? changedSettings[setting.key] 
                    : setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                >
                  {setting.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={setting.type === 'password' ? 'password' : 'text'}
                  value={changedSettings[setting.key] !== undefined 
                    ? changedSettings[setting.key] 
                    : setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  placeholder={setting.description}
                />
              )}
            </div>
          ))}
        </div>

        {hasChanges && (
          <div className="admin-actions">
            <button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={handleCancel} className="cancel-btn">
              Cancel
            </button>
          </div>
        )}
      </div>

      <style>{`
        .store-status-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          background: var(--bg-secondary);
          border-radius: 8px;
          margin-bottom: 24px;
          border-left: 4px solid;
        }
        
        .store-status-card.enabled {
          border-left-color: #22c55e;
        }
        
        .store-status-card.disabled {
          border-left-color: #ef4444;
        }
        
        .store-status-info h3 {
          margin-bottom: 8px;
        }
        
        .store-status-info p {
          color: var(--text-secondary);
          margin: 0;
        }
        
        .store-status-indicator {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
        }
        
        .store-status-card.enabled .store-status-indicator {
          background: #22c55e20;
          color: #22c55e;
        }
        
        .store-status-card.disabled .store-status-indicator {
          background: #ef444420;
          color: #ef4444;
        }
      `}</style>
    </AdminLayout>
  );
}

export default AdminStoreConfig;
