import './OrderSummary.css';

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

export default function OrderSummary({ cart, showShipping = false }) {
  if (!cart) return null;

  const currency = cart.currency_code?.toUpperCase() || 'USD';
  const subtotal = formatPrice(cart.subtotal, currency);
  const shipping = showShipping && cart.shipping_total
    ? formatPrice(cart.shipping_total, currency)
    : showShipping ? 'Calculated at checkout' : null;
  const total = formatPrice(cart.total, currency);

  return (
    <div className="order-summary">
      <h3 className="order-summary-title">Order Summary</h3>
      
      <div className="order-summary-items">
        {cart.items?.map((item) => (
          <div key={item.id} className="order-summary-item">
            <img
              src={item.thumbnail || 'https://via.placeholder.com/40x40?text=N/A'}
              alt={item.title}
              className="order-summary-item-image"
            />
            <div className="order-summary-item-info">
              <span className="order-summary-item-title">{item.title}</span>
              <span className="order-summary-item-qty">x{item.quantity}</span>
            </div>
            <span className="order-summary-item-price">
              {formatPrice(item.unit_price * item.quantity, currency)}
            </span>
          </div>
        ))}
      </div>

      <div className="order-summary-calculations">
        <div className="order-summary-row">
          <span>Subtotal</span>
          <span>{subtotal}</span>
        </div>
        {shipping && (
          <div className="order-summary-row">
            <span>Shipping</span>
            <span>{shipping}</span>
          </div>
        )}
        <div className="order-summary-row order-summary-total">
          <span>Total</span>
          <span>{total}</span>
        </div>
      </div>
    </div>
  );
}
