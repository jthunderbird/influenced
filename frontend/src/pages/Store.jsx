import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import storeApi from '../services/store';
import { useCart } from '../contexts/CartContext';
import './Store.css';

export default function Store() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);
  const { fetchCart } = useCart();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [configData, productsData] = await Promise.all([
          storeApi.getConfig(),
          storeApi.getProducts({ limit: 50 }),
        ]);
        setConfig(configData);
        setProducts(productsData.products || []);
        await fetchCart();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchCart]);

  if (loading) {
    return (
      <div className="store-page">
        <div className="store-hero">
          <h1>Loading...</h1>
        </div>
        <div className="product-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="product-card-skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text short"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="store-page">
        <div className="error">
          <p>Failed to load store: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="store-page">
      <div className="store-hero">
        <h1>{config?.name || 'Store'}</h1>
        <p>Browse our collection</p>
      </div>

      {products.length === 0 ? (
        <div className="no-content">
          <p>No products available</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} currency={config?.currency || 'USD'} />
          ))}
        </div>
      )}
    </div>
  );
}
