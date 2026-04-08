import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import './ProductCard.css';

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
  const symbol = CURRENCY_SYMBOLS[currency?.toUpperCase()] || currency?.toUpperCase() + ' ' || '$';
  if (amount === null || amount === undefined || amount === 0) {
    return 'Price TBD';
  }
  return `${symbol}${(amount / 100).toFixed(2)}`;
};

export default function ProductCard({ product, currency = 'USD' }) {
  const { addToCart, loading } = useCart();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const variantId = product.variants?.[0]?.id;
    if (variantId) {
      try {
        await addToCart(variantId, 1);
      } catch (err) {
        console.error('Failed to add to cart:', err);
      }
    }
  };

  const thumbnail = product.thumbnail || product.images?.[0]?.url || 'https://via.placeholder.com/320x180?text=No+Image';
  
  // Get price from first variant
  const variant = product.variants?.[0];
  const priceAmount = variant?.prices?.[0]?.amount;
  // Use variant's currency if available, otherwise use configured currency
  const priceCurrency = variant?.prices?.[0]?.currency_code || currency;
  const price = formatPrice(priceAmount, priceCurrency);

  return (
    <Link to={`/store/product/${product.id}`} className="product-card">
      <div className="product-card-image-wrapper">
        <img src={thumbnail} alt={product.title} className="product-card-image" />
      </div>
      <div className="product-card-info">
        <h3 className="product-card-title">{product.title}</h3>
        <p className="product-card-price">{price}</p>
        <button
          type="button"
          className="product-card-btn"
          onClick={handleAddToCart}
          disabled={loading || !product.variants?.length}
        >
          Add to Cart
        </button>
      </div>
    </Link>
  );
}
