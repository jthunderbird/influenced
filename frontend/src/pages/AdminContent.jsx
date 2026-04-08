import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import AdminLayout from '../components/AdminLayout';

function AdminContent() {
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
      const data = await adminApi.getContentSettings();
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
      setSuccess('Settings saved successfully!');
      setChangedSettings({});
      setTimeout(() => setSuccess(''), 3000);
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

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-header">
          <h1>Content Settings</h1>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="info-card">
          <p>These settings control how much recent content appears on the home page. Changes take effect immediately without requiring a restart.</p>
        </div>

        <div className="settings-grid">
          {settings.map(setting => (
            <div key={setting.key} className="setting-item">
              <label>
                {setting.key.replace(/_/g, ' ')}
              </label>
              <p className="setting-description">{setting.description}</p>
              {setting.type === 'number' ? (
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={changedSettings[setting.key] !== undefined 
                    ? changedSettings[setting.key] 
                    : setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  value={changedSettings[setting.key] !== undefined 
                    ? changedSettings[setting.key] 
                    : setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
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
        .info-card {
          background: var(--bg-secondary);
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        
        .info-card p {
          margin: 0;
          color: var(--text-secondary);
        }
      `}</style>
    </AdminLayout>
  );
}

export default AdminContent;
