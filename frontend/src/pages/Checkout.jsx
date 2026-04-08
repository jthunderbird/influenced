import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import OrderSummary from '../components/OrderSummary';
import { useCart } from '../contexts/CartContext';
import storeApi from '../services/store';
import './Checkout.css';

export default function Checkout() {
  const { cart, loading: cartLoading, fetchCart, clearCart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    address_1: '',
    address_2: '',
    city: '',
    province: '',
    postal_code: '',
    country_code: 'US',
  });

  useEffect(() => {
    if (!cart) {
      fetchCart();
    }
  }, [cart, fetchCart]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await storeApi.initiateCheckout();
      const result = await storeApi.completeCheckout();

      if (result.success && result.order) {
        clearCart();
        navigate(`/order/${result.order.id}`);
      } else {
        setError('Checkout failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cartLoading && !cart) {
    return (
      <div className="checkout-page">
        <h1 className="page-title">Checkout</h1>
        <div className="checkout-loading">Loading...</div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="checkout-page">
        <h1 className="page-title">Checkout</h1>
        <div className="checkout-empty">
          <p>Your cart is empty.</p>
          <Link to="/store">Return to Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1 className="page-title">Checkout</h1>

      <div className="checkout-content">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <div className="checkout-section">
            <h2>Shipping Address</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address_1">Address</label>
              <input
                type="text"
                id="address_1"
                name="address_1"
                value={formData.address_1}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address_2">Apartment, suite, etc. (optional)</label>
              <input
                type="text"
                id="address_2"
                name="address_2"
                value={formData.address_2}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="province">State / Province</label>
                <input
                  type="text"
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="postal_code">Postal Code</label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="country_code">Country</label>
                <select
                  id="country_code"
                  name="country_code"
                  value={formData.country_code}
                  onChange={handleChange}
                  required
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
            </div>
          </div>

          <div className="checkout-section">
            <h2>Payment</h2>
            <p className="payment-note">
              Payment will be processed securely via Stripe. You'll be redirected to complete payment.
            </p>
          </div>

          {error && (
            <div className="checkout-error">
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="checkout-submit"
            disabled={loading || cartLoading}
          >
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </form>

        <div className="checkout-sidebar">
          <OrderSummary cart={cart} showShipping={true} />
        </div>
      </div>
    </div>
  );
}
