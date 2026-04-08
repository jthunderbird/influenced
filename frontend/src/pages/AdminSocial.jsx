import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import AdminLayout from '../components/AdminLayout';

function AdminSocial() {
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
      const data = await adminApi.getSocialSettings();
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
      setSuccess('Updating...');
      await adminApi.restart();
      await new Promise(resolve => setTimeout(resolve, 2000));
      window.location.reload();
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
          <h1>Social Media</h1>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="settings-grid">
          {settings.map(setting => (
            <div key={setting.key} className="setting-item">
              <label>
                {setting.key.replace(/_HANDLE$/, '').replace(/_/g, ' ')}
                {setting.restartRequired && <span className="restart-badge">Restart required</span>}
              </label>
              <p className="setting-description">{setting.description}</p>
              <div className="input-with-prefix">
                <span className="input-prefix">@</span>
                <input
                  type="text"
                  value={changedSettings[setting.key] !== undefined 
                    ? changedSettings[setting.key] 
                    : setting.value}
                  onChange={(e) => handleChange(setting.key, e.target.value)}
                  placeholder={setting.value || 'username'}
                />
              </div>
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
        .input-with-prefix {
          display: flex;
          align-items: center;
        }
        
        .input-prefix {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-right: none;
          padding: 10px 12px;
          border-radius: 4px 0 0 4px;
          color: var(--text-secondary);
        }
        
        .input-with-prefix input {
          border-radius: 0 4px 4px 0;
        }
      `}</style>
    </AdminLayout>
  );
}

export default AdminSocial;
