import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import storeApi from '../services/store';
import './OrderConfirmation.css';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await storeApi.getOrder(orderId);
        setOrder(data.order);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="order-confirmation-page">
        <div className="order-loading">Loading order details...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-confirmation-page">
        <div className="order-error">
          <h2>Unable to load order</h2>
          <p>{error || 'Order not found'}</p>
          <Link to="/store">Return to Store</Link>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const total = order.total ? `$${(order.total / 100).toFixed(2)}` : '$0.00';

  return (
    <div className="order-confirmation-page">
      <div className="order-success">
        <div className="success-icon">✓</div>
        <h1>Order Placed Successfully!</h1>
        <p className="order-number">Order #{order.display_id || order.id}</p>
      </div>

      <div className="order-details">
        <div className="order-section">
          <h2>Order Details</h2>
          <p className="order-date">Placed on {orderDate}</p>

          <div className="order-items">
            {order.items?.map((item) => (
              <div key={item.id} className="order-item">
                <img
                  src={item.thumbnail || 'https://via.placeholder.com/60x60?text=N/A'}
                  alt={item.title}
                  className="order-item-image"
                />
                <div className="order-item-info">
                  <span className="order-item-title">{item.title}</span>
                  {item.variant && <span className="order-item-variant">{item.variant.title}</span>}
                  <span className="order-item-qty">Quantity: {item.quantity}</span>
                </div>
                <span className="order-item-price">
                  ${((item.unit_price * item.quantity) / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="order-total">
            <span>Total Paid</span>
            <span>{total}</span>
          </div>
        </div>

        {order.shipping_address && (
          <div className="order-section">
            <h2>Shipping Address</h2>
            <address className="shipping-address">
              <p>{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
              <p>{order.shipping_address.address_1}</p>
              {order.shipping_address.address_2 && <p>{order.shipping_address.address_2}</p>}
              <p>
                {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}
              </p>
              <p>{order.shipping_address.country_code}</p>
            </address>
          </div>
        )}

        <div className="order-section">
          <h2>What's Next?</h2>
          <ul className="next-steps">
            <li>You'll receive an email confirmation with your order details</li>
            <li>We'll notify you when your order ships</li>
            <li>Tracking information will be available once your order ships</li>
          </ul>
        </div>
      </div>

      <div className="order-actions">
        <Link to="/store" className="btn-secondary">Continue Shopping</Link>
      </div>
    </div>
  );
}
