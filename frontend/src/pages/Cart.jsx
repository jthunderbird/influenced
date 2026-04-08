import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CartItem from '../components/CartItem';
import OrderSummary from '../components/OrderSummary';
import { useCart } from '../contexts/CartContext';
import './Cart.css';

export default function Cart() {
  const { cart, loading, error, fetchCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const hasItems = cart?.items?.length > 0;

  if (loading && !cart) {
    return (
      <div className="cart-page">
        <h1 className="page-title">Shopping Cart</h1>
        <div className="cart-loading">
          <div className="skeleton-cart-item"></div>
          <div className="skeleton-cart-item"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-page">
        <h1 className="page-title">Shopping Cart</h1>
        <div className="error">
          <p>Failed to load cart: {error}</p>
          <button onClick={fetchCart}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="page-title">Shopping Cart</h1>

      {!hasItems ? (
        <div className="cart-empty">
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <Link to="/store" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            {cart.items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          <div className="cart-sidebar">
            <OrderSummary cart={cart} showShipping={true} />
            <div className="cart-actions">
              <Link to="/store" className="btn-secondary">Continue Shopping</Link>
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
