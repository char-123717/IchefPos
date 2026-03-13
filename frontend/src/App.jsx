import { Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';

import MenuPage from './pages/customer/MenuPage';
import PaymentPage from './pages/customer/PaymentPage';
import DashboardPage from './pages/cashier/DashboardPage';
import KitchenPage from './pages/kitchen/KitchenPage';
import QRCodesPage from './pages/admin/QRCodesPage';
import MenuManagerPage from './pages/admin/MenuManagerPage';

export default function App() {
  return (
    <CartProvider>
      <OrderProvider>
        <Routes>
          {/* Customer Routes — table number from QR code URL */}
          <Route path="/table/:tableNumber" element={<MenuPage />} />
          <Route path="/table/:tableNumber/payment" element={<PaymentPage />} />

          {/* Cashier Route */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Kitchen Route */}
          <Route path="/kitchen" element={<KitchenPage />} />

          {/* QR Code Generator */}
          <Route path="/qr-codes" element={<QRCodesPage />} />

          {/* Owner Menu Manager */}
          <Route path="/owner/menu" element={<MenuManagerPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </OrderProvider>
    </CartProvider>
  );
}
