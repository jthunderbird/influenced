import { createContext, useContext, useState, useEffect } from 'react';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [config, setConfig] = useState({ enabled: false, loading: true });

  useEffect(() => {
    fetch('/api/store/config')
      .then(res => res.json())
      .then(data => setConfig({ ...data, loading: false }))
      .catch(() => setConfig({ enabled: false, loading: false }));
  }, []);

  return (
    <StoreContext.Provider value={config}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStoreConfig() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreConfig must be used within StoreProvider');
  }
  return context;
}