import { createContext, useContext, useState, useCallback } from 'react';
import storeApi from '../services/store';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await storeApi.getCart();
      setCart(data.cart);
    } catch (err) {
      setError(err.message);
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = useCallback(async (variantId, quantity = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await storeApi.addToCart(variantId, quantity);
      setCart(data.cart);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (lineItemId, quantity) => {
    setLoading(true);
    setError(null);
    try {
      const data = await storeApi.updateCartItem(lineItemId, quantity);
      setCart(data.cart);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (lineItemId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await storeApi.removeCartItem(lineItemId);
      setCart(data.cart);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart(null);
    setError(null);
  }, []);

  const value = {
    cart,
    loading,
    error,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
