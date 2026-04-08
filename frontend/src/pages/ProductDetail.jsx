import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import QuantitySelector from '../components/QuantitySelector';
import { useCart } from '../contexts/CartContext';
import storeApi from '../services/store';
import './ProductDetail.css';

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  CHF: 'CHF ',
  CNY: '¥',
  INR: '₹',
  MXN: 'MX$',
  BRL: 'R$',
};

const formatPrice = (amount, currency = 'USD') => {
  if (!amount && amount !== 0) return 'Price TBD';
  const symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';
  return `${symbol}${(amount / 100).toFixed(2)}`;
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, loading: cartLoading } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await storeApi.getProduct(id);
        setProduct(data.product);
        if (data.product?.variants?.length) {
          setSelectedVariant(data.product.variants[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    try {
      await addToCart(selectedVariant.id, quantity);
      navigate('/cart');
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-loading">
          <div className="skeleton-image-large"></div>
          <div className="skeleton-content">
            <div className="skeleton-text large"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="error">
          <p>{error || 'Product not found'}</p>
          <Link to="/store">Back to Store</Link>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const currentImage = images[selectedImage]?.url || 'https://via.placeholder.com/600x600?text=No+Image';
  const priceAmount = selectedVariant?.prices?.[0]?.amount;
  const priceCurrency = selectedVariant?.prices?.[0]?.currency_code?.toUpperCase() || 'USD';
  const price = formatPrice(priceAmount, priceCurrency);

  return (
    <div className="product-detail-page">
      <Link to="/store" className="back-link">← Back to Store</Link>
      
      <div className="product-detail-grid">
        <div className="product-detail-gallery">
          <div className="gallery-main">
            <img src={currentImage} alt={product.title} />
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbnails">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`gallery-thumb ${idx === selectedImage ? 'active' : ''}`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <img src={img.url} alt={`${product.title} ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <h1 className="product-detail-title">{product.title}</h1>
          <p className="product-detail-price">{price}</p>
          
          {product.description && (
            <div className="product-detail-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          {product.variants?.length > 1 && (
            <div className="product-detail-variants">
              <h3>Options</h3>
              <div className="variant-options">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    className={`variant-option ${variant.id === selectedVariant?.id ? 'selected' : ''}`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    {variant.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="product-detail-actions">
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={selectedVariant?.inventory_quantity || 99}
            />
            <button
              type="button"
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={cartLoading || !selectedVariant}
            >
              {cartLoading ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
