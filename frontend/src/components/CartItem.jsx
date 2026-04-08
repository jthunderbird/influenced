import QuantitySelector from './QuantitySelector';
import { useCart } from '../contexts/CartContext';
import './CartItem.css';

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
  if (!amount && amount !== 0) return '$0.00';
  const symbol = CURRENCY_SYMBOLS[currency] || currency + ' ';
  return `${symbol}${(amount / 100).toFixed(2)}`;
};

export default function CartItem({ item }) {
  const { updateQuantity, removeItem, loading } = useCart();

  const thumbnail = item.thumbnail || item.product?.thumbnail || 'https://via.placeholder.com/80x80?text=No+Image';
  const currency = item.currency_code?.toUpperCase() || 'USD';
  const unitPrice = formatPrice(item.unit_price, currency);
  const lineTotal = formatPrice(item.unit_price * item.quantity, currency);

  const handleQuantityChange = async (newQuantity) => {
    try {
      await updateQuantity(item.id, newQuantity);
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const handleRemove = async () => {
    try {
      await removeItem(item.id);
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  return (
    <div className="cart-item">
      <img src={thumbnail} alt={item.title} className="cart-item-image" />
      <div className="cart-item-details">
        <h4 className="cart-item-title">{item.title}</h4>
        {item.variant && <p className="cart-item-variant">{item.variant.title}</p>}
        <p className="cart-item-price">{unitPrice}</p>
      </div>
      <div className="cart-item-actions">
        <QuantitySelector
          value={item.quantity}
          onChange={handleQuantityChange}
          disabled={loading}
        />
        <button
          type="button"
          className="cart-item-remove"
          onClick={handleRemove}
          disabled={loading}
        >
          Remove
        </button>
      </div>
      <div className="cart-item-total">
        <span className="cart-item-total-label">Total</span>
        <span className="cart-item-total-value">{lineTotal}</span>
      </div>
    </div>
  );
}
