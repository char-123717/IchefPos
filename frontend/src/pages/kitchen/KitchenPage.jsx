import { useEffect, useMemo, useState } from 'react';
import { useOrders } from '../../context/OrderContext';
import OrderCard from '../../components/OrderCard';
import './KitchenPage.css';

const kitchenColumns = [
  { key: 'confirmed', title: '🔥 Cooking', color: '#f97316' },
  { key: 'done', title: '✅ Order Done', color: '#22c55e' }
];

export default function KitchenPage() {
  const { orders, loading, fetchOrders, getOrdersByStatus, updateItemStatus } = useOrders();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const kitchenStats = useMemo(() => {
    const activeKitchenOrders = getOrdersByStatus('confirmed').filter(
      o => !o.items.every(i => i.itemStatus === 'ready' || i.itemStatus === 'served')
    );

    let menuCount = 0;
    activeKitchenOrders.forEach(o => {
      o.items.forEach(item => {
        if (item.itemStatus === 'cooking') {
          menuCount += (item.quantity || 1);
        }
      });
    });

    let totalMenuAllTime = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
    
    todayOrders.forEach(o => {
      if (o.status === 'confirmed' || o.status === 'done') {
        o.items.forEach(item => {
          totalMenuAllTime += (item.quantity || 1);
        });
      }
    });

    return {
      orderCount: activeKitchenOrders.length,
      menuCount,
      totalMenuAllTime
    };
  }, [orders]);

  const handleUpdateItemStatus = async (orderId, itemId, itemStatus) => {
    try {
      await updateItemStatus(orderId, itemId, itemStatus);
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  return (
    <div className="kitchen">
      {/* Header */}
      <header className="kitchen__header">
        <div className="kitchen__header-left">
          <div>
            <h1 className="kitchen__title">🍳 Kitchen Display</h1>
            <p className="kitchen__date" style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              <span style={{ margin: '0 8px', color: '#f97316' }}>•</span>
              <span style={{ fontWeight: 'bold' }}>{currentTime.toLocaleTimeString('id-ID', { hour12: false })}</span>
            </p>
          </div>
          <div className="kitchen__stats-container">
            <div className="kitchen__stat-box kitchen__stat-box--order">
              <span className="kitchen__stat-icon">📑</span>
              <div className="kitchen__stat-info">
                <span className="kitchen__stat-value">{kitchenStats.orderCount}</span>
                <span className="kitchen__stat-label">Total Order</span>
              </div>
            </div>
            <div className="kitchen__stat-box kitchen__stat-box--menu">
              <span className="kitchen__stat-icon">🔥</span>
              <div className="kitchen__stat-info">
                <span className="kitchen__stat-value">{kitchenStats.menuCount}</span>
                <span className="kitchen__stat-label">Total Menu Cook</span>
              </div>
            </div>
            <div className="kitchen__stat-box kitchen__stat-box--total">
              <span className="kitchen__stat-icon">🍽️</span>
              <div className="kitchen__stat-info">
                <span className="kitchen__stat-value">{kitchenStats.totalMenuAllTime}</span>
                <span className="kitchen__stat-label">Total Menu In</span>
              </div>
            </div>
          </div>
        </div>
        <div className="kitchen__meta">
          <button className="kitchen__refresh" onClick={fetchOrders} title="Refresh Data">🔄</button>
        </div>
      </header>

      {/* Board */}
      {loading ? (
        <div className="kitchen__loading">
          <div className="spinner"></div>
          <p>Memuat pesanan...</p>
        </div>
      ) : (
        <div className="kitchen__board">
          {kitchenColumns.map(col => {
            // Kitchen-specific: auto-move confirmed orders with all-ready items to Done column
            let colOrders;
            if (col.key === 'confirmed') {
              colOrders = getOrdersByStatus('confirmed').filter(
                o => !o.items.every(i => i.itemStatus === 'ready' || i.itemStatus === 'served')
              );
            } else if (col.key === 'done') {
              // Include actual done + confirmed-but-all-ready-or-served
              const actualDone = getOrdersByStatus('done');
              const allReadyConfirmed = getOrdersByStatus('confirmed').filter(
                o => o.items.every(i => i.itemStatus === 'ready' || i.itemStatus === 'served')
              );
              colOrders = [...allReadyConfirmed, ...actualDone];
            } else {
              colOrders = getOrdersByStatus(col.key);
            }

            let renderItems;
            let countLabel = 0;

            if (col.key === 'confirmed') {
              countLabel = colOrders.length;
              const sortedOrders = [...colOrders].sort((a, b) => new Date(a.confirmedAt || a.createdAt) - new Date(b.confirmedAt || b.createdAt));
              renderItems = sortedOrders.length === 0 ? (
                <p className="kitchen-column__empty">—</p>
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
                          <div key={item._id || i} className={`order-card__item ${item.itemStatus === 'ready' || item.itemStatus === 'served' ? 'order-card__item--struck' : ''}`}>
                            <div className="order-card__item-info">
                              <span className="order-card__item-qty">{item.quantity}x</span>
                              <span className="order-card__item-name">{item.name}</span>
                            </div>

                            {item.itemStatus === 'cooking' && (
                              <button className="item-ready-btn" onClick={() => handleUpdateItemStatus(order._id, item._id, 'ready')}>
                                ✅ Ready
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              );
            } else {
              // Done tab: individual orders per container, sorted oldest first (by confirmedAt)
              const sortedOrders = [...colOrders].sort((a, b) => new Date(a.confirmedAt || a.createdAt) - new Date(b.confirmedAt || b.createdAt));
              countLabel = sortedOrders.length;

              renderItems = sortedOrders.length === 0 ? (
                <p className="kitchen-column__empty">—</p>
              ) : (
                sortedOrders.map(order => {
                  const orderTime = new Date(order.confirmedAt || order.createdAt).toLocaleTimeString('id-ID', { hour12: false });
                  return (
                    <div key={order._id} className="order-card order-card--done">
                      <div className="order-card__header">
                        <div className="order-card__number" style={{ fontSize: '1.1rem' }}>{order.orderNumber}</div>
                        <span style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 'bold' }}>⏱️ {orderTime}</span>
                      </div>
                      <div className="order-card__items">
                        <div style={{ fontSize: '0.8rem', color: '#f97316', fontWeight: 700, marginBottom: 8 }}>
                          🪑 Meja {order.tableNumber}
                        </div>
                        {order.items.map((item, i) => (
                          <div key={item._id || i} className={`order-card__item ${item.itemStatus === 'ready' || item.itemStatus === 'served' ? 'order-card__item--struck' : ''}`}>
                            <div className="order-card__item-info">
                              <span className="order-card__item-qty">{item.quantity}x</span>
                              <span className="order-card__item-name">{item.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              );
            }

            return (
              <div key={col.key} className="kitchen-column">
                <div className="kitchen-column__header" style={{ borderBottomColor: col.color }}>
                  <span className="kitchen-column__title">{col.title}</span>
                  {countLabel > 0 && (
                    <span className="kitchen-column__count" style={{ background: col.color }}>
                      {countLabel}
                    </span>
                  )}
                </div>
                <div className="kitchen-column__cards">
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
