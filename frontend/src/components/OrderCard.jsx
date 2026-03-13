import { useState, useCallback } from 'react';
import './OrderCard.css';

export default function OrderCard({ order, variant = 'cashier', onConfirm, onDone, onUpdateItemStatus }) {
  const [servedItems, setServedItems] = useState(new Set());

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('id-ID', { hour12: false });
  };

  const isKitchen = variant === 'kitchen';
  const isCashier = variant === 'cashier';

  const handleServe = useCallback((itemId) => {
    setServedItems(prev => {
      const next = new Set(prev);
      next.add(itemId);

      // Check if ALL items in this order are ready and served
      const allReady = order.items.every(i => i.itemStatus === 'ready');
      const allServed = order.items.every(i => next.has(i._id));

      if (allReady && allServed && onDone) {
        setTimeout(() => onDone(order._id), 400);
      }

      return next;
    });
  }, [order, onDone]);

  return (
    <div className={`order-card order-card--${order.status}`}>
      <div className="order-card__header">
        <div className="order-card__number">{order.orderNumber}</div>
      </div>

      <div className="order-card__meta">
        <span className="order-card__table">🪑 Meja {order.tableNumber}</span>
        <span className="order-card__time">⏱️ {formatTime(order.status === 'confirmed' ? (order.confirmedAt || order.createdAt) : order.createdAt)}</span>
      </div>

      {/* Items with per-item status */}
      <div className="order-card__items">
        {order.items.map((item, i) => {
          const isReady = item.itemStatus === 'ready';
          const isServed = servedItems.has(item._id);

          return (
            <div key={item._id || i} className={`order-card__item ${isKitchen && isReady ? 'order-card__item--struck' : ''} ${isCashier && isServed ? 'order-card__item--struck' : ''}`}>
              <div className="order-card__item-info">
                <span className="order-card__item-qty">{item.quantity}x</span>
                <span className="order-card__item-name">{item.name}</span>
                {!isKitchen && (
                  <span className="order-card__item-price">
                    Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                  </span>
                )}
              </div>

              {/* Per-item status + actions */}
              {order.status === 'confirmed' && (
                <div className="order-card__item-status">
                  {/* Kitchen: Ready button for cooking items, nothing for ready (already struck) */}
                  {isKitchen && item.itemStatus === 'cooking' && (
                    <button
                      className="item-ready-btn"
                      onClick={() => onUpdateItemStatus(order._id, item._id, 'ready')}
                    >
                      ✅ Ready
                    </button>
                  )}

                  {/* Cashier: show serve button for ready items */}
                  {isCashier && isReady && !isServed && (
                    <button className="item-serve-btn" onClick={() => handleServe(item._id)}>
                      🍽️ Serve
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer with total (cashier only) */}
      {!isKitchen && (
        <div className="order-card__footer">
          <div className="order-card__total">
            Total: <strong>Rp {order.totalPrice.toLocaleString('id-ID')}</strong>
          </div>
          <div className="order-card__payment">
            {order.paymentMethod === 'QRIS' ? '📱' : '💵'} {order.paymentMethod}
          </div>
        </div>
      )}

      {/* Confirm button for cashier on paid orders */}
      {isCashier && order.status === 'paid' && onConfirm && (
        <button
          className="order-card__action-btn order-card__action-btn--confirm"
          onClick={() => onConfirm(order._id)}
        >
          ✅ Confirm Order
        </button>
      )}
    </div>
  );
}
