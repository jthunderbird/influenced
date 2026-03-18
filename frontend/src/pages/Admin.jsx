import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';

function Admin() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [changedSettings, setChangedSettings] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await adminApi.getSettings();
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
      
      // Trigger server restart and wait a bit
      await adminApi.restart();
      
      // Wait for restart to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reload the page
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

  const handleLogout = async () => {
    await adminApi.logout();
    navigate('/admin/login');
  };

  if (loading) return <div className="loading">Loading...</div>;

  const hasChanges = Object.keys(changedSettings).length > 0;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Settings</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="settings-grid">
        {settings.map(setting => (
          <div key={setting.key} className="setting-item">
            <label>
              {setting.key}
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
            ) : setting.type === 'number' ? (
              <input
                type="number"
                value={changedSettings[setting.key] !== undefined 
                  ? changedSettings[setting.key] 
                  : setting.value}
                onChange={(e) => handleChange(setting.key, e.target.value)}
              />
            ) : (
              <input
                type={setting.type === 'password' ? 'password' : 'text'}
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
  );
}

export default Admin;
