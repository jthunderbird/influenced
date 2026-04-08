import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import AdminLayout from '../components/AdminLayout';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await adminApi.getMedusaOrders();
      setOrders(data.orders || []);
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

  const formatPrice = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      completed: 'status-completed',
      cancelled: 'status-cancelled',
      refunded: 'status-refunded',
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || ''}`}>
        {status || 'pending'}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Loading orders...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-header">
          <h1>Orders</h1>
        </div>

        {error && <div className="error">{error}</div>}

        {orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders found yet. Orders will appear here when customers make purchases.</p>
          </div>
        ) : (
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>#{order.display_id}</strong>
                    </td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>
                      {order.customer?.first_name} {order.customer?.last_name}
                      <br />
                      <small>{order.customer?.email}</small>
                    </td>
                    <td>
                      {order.total && order.currency_code
                        ? formatPrice(order.total, order.currency_code)
                        : '-'}
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>{order.items?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .orders-table {
          background: var(--bg-secondary);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .orders-table table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .orders-table th,
        .orders-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }
        
        .orders-table th {
          background: var(--bg-tertiary);
          font-weight: 600;
          font-size: 14px;
        }
        
        .orders-table tr:hover {
          background: var(--bg-hover);
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        .status-pending {
          background: #f59e0b20;
          color: #f59e0b;
        }
        
        .status-completed {
          background: #22c55e20;
          color: #22c55e;
        }
        
        .status-cancelled {
          background: #ef444420;
          color: #ef4444;
        }
        
        .status-refunded {
          background: #6366f120;
          color: #6366f1;
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

export default AdminOrders;
