import { useEffect, useMemo, useRef, useState } from 'react';
import { useOrders } from '../../context/OrderContext';
import OrderCard from '../../components/OrderCard';
import './DashboardPage.css';

const statusColumns = [
  { key: 'paid', title: '💰 Paid', color: '#f59e0b' },
  { key: 'confirmed', title: '🔥 Cooking', color: '#f97316' },
  { key: 'done', title: '✅ Order Done', color: '#22c55e' }
];

export default function DashboardPage() {
  const { orders, loading, fetchOrders, getOrdersByStatus, confirmOrder, updateItemStatus, markOrderDone } = useOrders();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const processingDoneRef = useRef(new Set());

  useEffect(() => {
    // Auto-complete individual orders when all their items are 'served'
    const confirmedOrders = orders.filter(o => o.status === 'confirmed');

    confirmedOrders.forEach(order => {
      const allServed = order.items.length > 0 && order.items.every(item => item.itemStatus === 'served');
      
      if (allServed) {
        if (!processingDoneRef.current.has(order._id)) {
          processingDoneRef.current.add(order._id);
          markOrderDone(order._id).catch(err => {
            console.error(err);
            processingDoneRef.current.delete(order._id);
          });
        }
      }
    });
  }, [orders, markOrderDone]);

  // Compute stats from orders in real-time
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
    const activeOrders = todayOrders.filter(o => o.status === 'paid' || o.status === 'confirmed');

    // Unique table count for active orders
    const tables = new Set(activeOrders.map(o => o.tableNumber));

    // Count cooking, ready, and total menu items across all confirmed & done orders
    let totalMenu = 0;
    let cookCount = 0;
    let readyCount = 0;
    let totalQris = 0;
    let totalCash = 0;
    
    todayOrders.forEach(o => {
      // Revenue Breakdown
      if (o.paymentMethod === 'QRIS') {
        totalQris += o.totalPrice;
      } else if (o.paymentMethod === 'Cash') {
        totalCash += o.totalPrice;
      }

      if (o.status === 'confirmed' || o.status === 'done') {
        o.items.forEach(item => {
          totalMenu += (item.quantity || 1);
          if (item.itemStatus === 'cooking') cookCount += item.quantity;
          if (item.itemStatus === 'ready') readyCount += item.quantity;
        });
      }
    });

    return {
      totalTables: tables.size,
      totalOrders: activeOrders.length,
      totalRevenue: todayOrders.reduce((sum, o) => sum + o.totalPrice, 0),
      totalQris,
      totalCash,
      totalMenu,
      cookCount,
      readyCount
    };
  }, [orders]);

  const handleConfirm = async (orderId) => {
    try {
      await confirmOrder(orderId);
    } catch (err) {
      alert('Gagal confirm order');
    }
  };

  const handleUpdateItemStatus = async (orderId, itemId, itemStatus) => {
    try {
      await updateItemStatus(orderId, itemId, itemStatus);
    } catch (err) {
      alert('Gagal update item status');
    }
  };

  const handleDone = async (orderId) => {
    try {
      await markOrderDone(orderId);
    } catch (err) {
      alert('Gagal menyelesaikan order');
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">🍳 Dashboard Kasir</h1>
          <p className="dashboard__date">
            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            <span style={{ margin: '0 8px', color: '#f97316' }}>•</span>
            <span style={{ fontWeight: 'bold' }}>{currentTime.toLocaleTimeString('id-ID', { hour12: false })}</span>
          </p>
        </div>
        <button className="dashboard__refresh" onClick={fetchOrders}>
          🔄 Refresh
        </button>
      </header>

      {/* Stats */}
      <div className="dashboard__stats">
        <div className="stat-card" style={{ display: 'flex', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="stat-card__icon">🪑</span>
            <div>
              <p className="stat-card__value">{stats.totalTables}</p>
              <p className="stat-card__label">Total Table</p>
            </div>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="stat-card__icon">📋</span>
            <div>
              <p className="stat-card__value">{stats.totalOrders}</p>
              <p className="stat-card__label">Total Order</p>
            </div>
          </div>
        </div>

        {/* Total Menu with sub-containers */}
        <div className="stat-card stat-card--menu-group">
          <div className="stat-card__main">
            <span className="stat-card__icon">🍽️</span>
            <div>
              <p className="stat-card__value">{stats.totalMenu}</p>
              <p className="stat-card__label">Total Menu</p>
            </div>
          </div>
          <div className="stat-card__subs">
            <div className="stat-sub stat-sub--cook">
              <span className="stat-sub__icon">🔥</span>
              <span className="stat-sub__value">{stats.cookCount}</span>
              <span className="stat-sub__label">Cook</span>
            </div>
            <div className="stat-sub stat-sub--ready">
              <span className="stat-sub__icon">✅</span>
              <span className="stat-sub__value">{stats.readyCount}</span>
              <span className="stat-sub__label">Ready</span>
            </div>
          </div>
        </div>

        {/* Revenue with sub-containers */}
        <div className="stat-card stat-card--menu-group">
          <div className="stat-card__main">
            <span className="stat-card__icon">💰</span>
            <div>
              <p className="stat-card__value">Rp {stats.totalRevenue.toLocaleString('id-ID')}</p>
              <p className="stat-card__label">Pendapatan</p>
            </div>
          </div>
          <div className="stat-card__subs">
            <div className="stat-sub stat-sub--cash">
              <span className="stat-sub__icon">💵</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="stat-sub__value" style={{ color: '#22c55e', fontSize: '0.9rem' }}>Rp {stats.totalCash.toLocaleString('id-ID')}</span>
                <span className="stat-sub__label">CASH</span>
              </div>
            </div>
            <div className="stat-sub stat-sub--qris">
              <span className="stat-sub__icon">📱</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="stat-sub__value" style={{ color: '#3b82f6', fontSize: '0.9rem' }}>Rp {stats.totalQris.toLocaleString('id-ID')}</span>
                <span className="stat-sub__label">QRIS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="dashboard__loading">
          <div className="spinner"></div>
          <p>Memuat pesanan...</p>
        </div>
      ) : (
        <div className="dashboard__board">
          {statusColumns.map(col => {
            const colOrders = getOrdersByStatus(col.key);

            let renderItems;

            if (col.key === 'paid') {
              const sortedOrders = [...colOrders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
              renderItems = sortedOrders.length === 0 ? (
                <p className="board-column__empty">Tidak ada pesanan</p>
              ) : (
                sortedOrders.map(order => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    variant="cashier"
                    onConfirm={handleConfirm}
                    onDone={handleDone}
                    onUpdateItemStatus={handleUpdateItemStatus}
                  />
                ))
              );
            } else if (col.key === 'confirmed') {
              // Cooking tab: individual orders per container, sorted oldest first (by confirmation time)
              const sortedOrders = [...colOrders].sort((a, b) => new Date(a.confirmedAt || a.createdAt) - new Date(b.confirmedAt || b.createdAt));

              renderItems = sortedOrders.length === 0 ? (
                <p className="board-column__empty">Tidak ada pesanan</p>
              ) : (
                sortedOrders.map(order => {
                  const confirmTime = new Date(order.confirmedAt || order.createdAt).toLocaleTimeString('id-ID', { hour12: false });
                  return (
                    <div key={order._id} className="order-card order-card--confirmed">
                      <div className="order-card__header">
                        <div className="order-card__number" style={{ fontSize: '1.1rem' }}>{order.orderNumber}</div>
                        <span style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 'bold' }}>⏱️ {confirmTime}</span>
                      </div>
                      <div className="order-card__items">
                        <div style={{ fontSize: '0.8rem', color: '#f97316', fontWeight: 700, marginBottom: 8 }}>
                          🪑 Meja {order.tableNumber}
                        </div>
                        {order.items.map((item, i) => (
                          <div key={item._id || i} className={`order-card__item ${item.itemStatus === 'served' ? 'order-card__item--struck' : ''}`}>
                            <div className="order-card__item-info">
                              <span className="order-card__item-qty">{item.quantity}x</span>
                              <span className="order-card__item-name">{item.name}</span>
                            </div>

                            {item.itemStatus === 'ready' && (
                              <div className="order-card__item-status">
                                <button
                                  className="item-serve-btn"
                                  onClick={() => handleUpdateItemStatus(order._id, item._id, 'served')}
                                >
                                  🍽️ Serve
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              );
            } else if (col.key === 'done') {
              // Done tab: individual orders per container, sorted oldest first (by createdAt)
              const sortedOrders = [...colOrders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

              renderItems = sortedOrders.length === 0 ? (
                <p className="board-column__empty">Tidak ada pesanan</p>
              ) : (
                sortedOrders.map(order => {
                  const orderTime = new Date(order.createdAt).toLocaleTimeString('id-ID', { hour12: false });
                  return (
                    <div key={order._id} className="order-card order-card--done">
                      <div className="order-card__header">
                        <div className="order-card__number" style={{ fontSize: '1.1rem' }}>{order.orderNumber}</div>
                        <span style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 'bold' }}>⏱️ {orderTime}</span>
                      </div>
                      <div className="order-card__items">
                        <div style={{ fontSize: '0.8rem', color: '#f97316', fontWeight: 700, marginBottom: 8 }}>
                          🪑 Meja {order.tableNumber} — {order.paymentMethod === 'QRIS' ? '📱' : '💵'} {order.paymentMethod}
                        </div>
                        {order.items.map((item, i) => (
                          <div key={item._id || i} className="order-card__item">
                            <div className="order-card__item-info">
                              <span className="order-card__item-qty">{item.quantity}x</span>
                              <span className="order-card__item-name">{item.name}</span>
                              <span className="order-card__item-price" style={{ color: '#fff' }}>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="order-card__footer" style={{ borderTop: '2px solid rgba(249, 115, 22, 0.3)', paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>Total:</div>
                        <div style={{ fontSize: '1rem', color: '#f97316', fontWeight: 'bold' }}>Rp {order.totalPrice.toLocaleString('id-ID')}</div>
                      </div>
                    </div>
                  );
                })
              );
            }

            return (
              <div key={col.key} className="board-column">
                <div className="board-column__header" style={{ borderBottomColor: col.color }}>
                  <span className="board-column__title">{col.title}</span>
                  {colOrders.length > 0 && (
                    <span className="board-column__count" style={{ background: col.color }}>
                      {colOrders.length}
                    </span>
                  )}
                </div>
                <div className="board-column__cards">
                  {renderItems}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
