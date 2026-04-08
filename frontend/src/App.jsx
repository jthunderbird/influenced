import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import Videos from './pages/Videos';
import Shorts from './pages/Shorts';
import Live from './pages/Live';
import Posts from './pages/Posts';
import Playlists from './pages/Playlists';
import Search from './pages/Search';
import VideoPlayer from './components/VideoPlayer';
import Login from './pages/Login';
import Store from './pages/Store';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import AdminSettings from './pages/AdminSettings';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminStoreConfig from './pages/AdminStoreConfig';
import AdminSocial from './pages/AdminSocial';
import AdminContent from './pages/AdminContent';
import AdminSync from './pages/AdminSync';
import { api } from './services/api';
import { StoreProvider } from './contexts/StoreContext';
import { CartProvider } from './contexts/CartContext';

function App() {
  const [channelInfo, setChannelInfo] = useState(null);
  const [storeEnabled, setStoreEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const fetchChannelInfo = async () => {
      try {
        const data = await api.getChannel();
        setChannelInfo(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchStoreConfig = async () => {
      try {
        const config = await api.getStoreConfig();
        setStoreEnabled(config.enabled || false);
      } catch (err) {
        console.error('Error fetching store config:', err);
      }
    };

    fetchChannelInfo();
    fetchStoreConfig();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (channelInfo?.title) {
      document.title = `${channelInfo.title} - influenced`;
    }
  }, [channelInfo]);

  useEffect(() => {
    if (channelInfo?.avatar && typeof window !== 'undefined') {
      const link = document.querySelector("link[rel~='icon']");
      if (link) {
        link.href = channelInfo.avatar;
      }
    }
  }, [channelInfo]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading channel information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>
        <div>Error: {error}</div>
      </div>
    );
  }

  return (
    <StoreProvider>
      <CartProvider>
        <Router>
          <div className="app">
            <Header channelInfo={channelInfo} theme={theme} toggleTheme={toggleTheme} storeEnabled={storeEnabled} />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/videos" element={<Videos />} />
                <Route path="/shorts" element={<Shorts />} />
                <Route path="/live" element={<Live />} />
                <Route path="/posts" element={<Posts />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/search" element={<Search />} />
                <Route path="/watch/:videoId" element={<VideoPlayer />} />
                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin" element={<AdminSettings />} />
                <Route path="/admin/social" element={<AdminSocial />} />
                <Route path="/admin/content" element={<AdminContent />} />
                <Route path="/admin/store" element={<AdminStoreConfig />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/sync" element={<AdminSync />} />
                <Route path="/store" element={<Store />} />
                <Route path="/store/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order/:orderId" element={<OrderConfirmation />} />
              </Routes>
            </main>
          </div>
        </Router>
      </CartProvider>
    </StoreProvider>
  );
}

export default App;
