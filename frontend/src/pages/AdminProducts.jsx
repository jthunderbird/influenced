import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import AdminLayout from '../components/AdminLayout';

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currency, setCurrency] = useState('USD');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchStoreConfig();
  }, []);

  const fetchStoreConfig = async () => {
    try {
      const config = await adminApi.getStoreConfig();
      if (config?.currency) {
        setCurrency(config.currency);
      }
    } catch (err) {
      console.error('Error fetching store config:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getMedusaProducts();
      setProducts(data.products || []);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/admin/login');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshStock = async () => {
    setRefreshing(true);
    try {
      const updatedProducts = await Promise.all(
        (products || []).map(async (product) => {
          if (product.variants?.[0]?.id) {
            try {
              const inv = await adminApi.getVariantInventory(product.id, product.variants[0].id);
              return {
                ...product,
                actualStock: inv.stocked_quantity || 0,
              };
            } catch {
              return product;
            }
          }
          return product;
        })
      );
      setProducts(updatedProducts);
    } catch (err) {
      console.error('Error refreshing stock:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await adminApi.deleteMedusaProduct(id);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatPrice = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Loading products...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-header">
          <h1>Products</h1>
          <div className="header-actions">
            <button onClick={refreshStock} disabled={refreshing || products.length === 0} className="btn-secondary">
              {refreshing ? 'Refreshing...' : 'Refresh Stock'}
            </button>
            <button onClick={() => { setEditingProduct(null); setShowModal(true); }} className="btn-primary">
              Add Product
            </button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {products.length === 0 ? (
          <div className="empty-state">
            <p>No products found. Add your first product to get started.</p>
          </div>
        ) : (
          <div className="products-table">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const totalStock = product.actualStock !== undefined 
                    ? product.actualStock 
                    : product.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0;
                  return (
                    <tr key={product.id}>
                      <td>
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt={product.title} className="product-thumb" />
                        ) : (
                          <div className="product-thumb-placeholder">No image</div>
                        )}
                      </td>
                      <td>
                        <strong>{product.title}</strong>
                        <br />
                        <small>{product.handle}</small>
                      </td>
                      <td>
                        <span className={`status-badge ${product.status}`}>
                          {product.status || 'draft'}
                        </span>
                      </td>
                      <td>{totalStock}</td>
                      <td>
                        {product.variants?.[0]?.prices?.[0]
                          ? formatPrice(product.variants[0].prices[0].amount, product.variants[0].prices[0].currency_code)
                          : '-'}
                      </td>
                      <td>
                        <button 
                          onClick={() => { setEditingProduct(product); setShowModal(true); }}
                          className="btn-secondary btn-small"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="btn-danger btn-small"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <ProductModal
            product={editingProduct}
            currency={currency}
            onClose={() => { setShowModal(false); setEditingProduct(null); }}
            onSave={() => { setShowModal(false); setEditingProduct(null); fetchProducts(); }}
          />
        )}
      </div>

      <style>{`
        .products-table {
          background: var(--bg-secondary);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .products-table table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .products-table th,
        .products-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }
        
        .products-table th {
          background: var(--bg-tertiary);
          font-weight: 600;
          font-size: 14px;
        }
        
        .products-table tr:hover {
          background: var(--bg-hover);
        }
        
        .product-thumb {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 4px;
        }
        
        .product-thumb-placeholder {
          width: 60px;
          height: 60px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: var(--text-secondary);
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status-badge.published {
          background: #22c55e20;
          color: #22c55e;
        }
        
        .status-badge.draft {
          background: #f59e0b20;
          color: #f59e0b;
        }
        
        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
          margin-right: 8px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .btn-danger:hover {
          background: #dc2626;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px;
          background: var(--bg-secondary);
          border-radius: 8px;
          color: var(--text-secondary);
        }
      `}</style>
    </AdminLayout>
  );
}

function ProductModal({ product, onClose, onSave, currency = 'USD' }) {
  const [formData, setFormData] = useState({
    title: product?.title || '',
    description: product?.description || '',
    status: product?.status || 'draft',
    thumbnail: product?.thumbnail || '',
    price: product?.variants?.[0]?.prices?.[0]?.amount 
      ? (product.variants[0].prices[0].amount / 100).toFixed(2) 
      : '',
    inventory: product?.variants?.[0]?.inventory_quantity ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const priceAmount = Math.round(parseFloat(formData.price || 0) * 100);
      const currencyCode = currency.toLowerCase();
      const inventoryQty = parseInt(formData.inventory) || 0;
      
      const payload = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        thumbnail: formData.thumbnail || null,
        options: [{ title: 'Default', values: ['Default'] }],
        variants: [{
          title: 'Default',
          prices: [{ currency_code: currencyCode, amount: priceAmount }],
        }],
      };

      if (product) {
        await adminApi.updateMedusaProduct(product.id, {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          thumbnail: formData.thumbnail || null,
        });
        if (product.variants?.[0]?.id) {
          await adminApi.updateMedusaVariant(product.id, product.variants[0].id, {
            title: 'Default',
            prices: [{ currency_code: currencyCode, amount: priceAmount }],
          });
          if (inventoryQty >= 0) {
            await adminApi.updateVariantInventory(product.id, product.variants[0].id, inventoryQty);
          }
        }
      } else {
        await adminApi.createMedusaProduct(payload);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{product ? 'Edit Product' : 'Add Product'}</h2>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Price ({currency})</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label>Image URL</label>
            <input
              type="url"
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="form-group">
            <label>Stock Quantity (Left in Stock)</label>
            <input
              type="number"
              min="0"
              value={formData.inventory}
              onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: var(--bg-secondary);
          padding: 24px;
          border-radius: 8px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal-content h2 {
          margin-bottom: 20px;
        }
        
        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        
        .form-group textarea {
          resize: vertical;
        }
      `}</style>
    </div>
  );
}

export default AdminProducts;
