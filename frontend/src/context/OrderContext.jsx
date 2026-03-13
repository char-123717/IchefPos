import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import socket, { connectSocket } from '../services/socket';

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    connectSocket();

    socket.on('new-order', (order) => {
      setOrders(prev => [order, ...prev]);
    });

    socket.on('order-updated', (updatedOrder) => {
      setOrders(prev =>
        prev.map(o => o._id === updatedOrder._id ? updatedOrder : o)
      );
    });

    return () => {
      socket.off('new-order');
      socket.off('order-updated');
    };
  }, []);

  const getOrdersByStatus = (status) => {
    return orders.filter(o => o.status === status);
  };

  // Kasir confirms a paid order → confirmed
  const confirmOrder = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/confirm`);
    } catch (err) {
      console.error('Failed to confirm order:', err);
      throw err;
    }
  };

  // Kitchen updates individual item status (cooking → ready)
  const updateItemStatus = async (orderId, itemId, itemStatus) => {
    try {
      await api.patch(`/orders/${orderId}/items/${itemId}`, { itemStatus });
    } catch (err) {
      console.error('Failed to update item status:', err);
      throw err;
    }
  };

  // Kasir marks order as done (all items must be ready)
  const markOrderDone = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/done`);
    } catch (err) {
      console.error('Failed to mark order done:', err);
      throw err;
    }
  };

  // Legacy: update order status directly
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update order:', err);
      throw err;
    }
  };

  return (
    <OrderContext.Provider value={{
      orders,
      loading,
      fetchOrders,
      getOrdersByStatus,
      confirmOrder,
      updateItemStatus,
      markOrderDone,
      updateOrderStatus
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
