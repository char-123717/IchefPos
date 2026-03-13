import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import './PaymentPage.css';

export default function PaymentPage() {
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const navigate = useNavigate();
  const { tableNumber } = useParams();
  const { items, totalPrice, clearCart } = useCart();

  const handleConfirmPayment = async () => {
    if (items.length === 0) return;

    setLoading(true);
    try {
      const orderData = {
        tableNumber: parseInt(tableNumber),
        items: items.map(item => ({
          menuId: item.menuItem._id,
          name: item.menuItem.name,
          price: item.menuItem.price,
          quantity: item.quantity
        })),
        totalPrice,
        paymentMethod
      };

      const res = await api.post('/orders', orderData);
      setOrderNumber(res.data.orderNumber);
      setSuccess(true);
      clearCart();

      // Auto-redirect back to menu after 4 seconds
      setTimeout(() => {
        navigate(`/table/${tableNumber}`);
      }, 4000);
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Gagal membuat pesanan. Silakan coba lagi.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="payment-page">
        <div className="payment-success">
          <div className="payment-success__icon">✅</div>
          <h2 className="payment-success__title">Pesanan Berhasil!</h2>
          <p className="payment-success__number">{orderNumber}</p>
          <p className="payment-success__desc">
            Pesanan Anda sedang diproses. Silakan tunggu di meja Anda.
          </p>
          <div className="payment-success__loader"></div>
          <p className="payment-success__redirect">
            Kembali ke menu dalam beberapa detik...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      {/* Header */}
      <header className="payment-page__header">
        <button className="payment-page__back" onClick={() => navigate(`/table/${tableNumber}`)}>
          ← Kembali
        </button>
        <h1 className="payment-page__title">Pembayaran</h1>
      </header>

      <div className="payment-page__content">
        {/* Order Summary */}
        <div className="payment-section">
          <h2 className="payment-section__title">📋 Ringkasan Pesanan</h2>
          <div className="payment-section__card">
            <p className="payment-section__table">🪑 Meja {tableNumber}</p>
            <div className="payment-items">
              {items.map((item, i) => (
                <div key={i} className="payment-item">
                  <span className="payment-item__qty">{item.quantity}x</span>
                  <span className="payment-item__name">{item.menuItem.name}</span>
                  <span className="payment-item__price">
                    Rp {(item.menuItem.price * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
            <div className="payment-total">
              <span>Total</span>
              <strong>Rp {totalPrice.toLocaleString('id-ID')}</strong>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="payment-section">
          <h2 className="payment-section__title">💳 Metode Pembayaran</h2>
          <div className="payment-methods">
            <label
              className={`payment-method ${paymentMethod === 'QRIS' ? 'active' : ''}`}
              htmlFor="method-qris"
            >
              <input
                type="radio"
                id="method-qris"
                name="payment"
                value="QRIS"
                checked={paymentMethod === 'QRIS'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <div className="payment-method__content">
                <span className="payment-method__icon">📱</span>
                <div>
                  <p className="payment-method__name">QRIS</p>
                  <p className="payment-method__desc">Scan QR untuk bayar</p>
                </div>
              </div>
            </label>

            <label
              className={`payment-method ${paymentMethod === 'Cash' ? 'active' : ''}`}
              htmlFor="method-cash"
            >
              <input
                type="radio"
                id="method-cash"
                name="payment"
                value="Cash"
                checked={paymentMethod === 'Cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <div className="payment-method__content">
                <span className="payment-method__icon">💵</span>
                <div>
                  <p className="payment-method__name">Cash</p>
                  <p className="payment-method__desc">Bayar di kasir</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* QRIS Display */}
        {paymentMethod === 'QRIS' && (
          <div className="payment-qris">
            <div className="payment-qris__code">
              <div className="payment-qris__placeholder">
                <span>📱</span>
                <p>QR Code</p>
                <small>Scan untuk membayar</small>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Button */}
        <button
          className="payment-confirm-btn"
          onClick={handleConfirmPayment}
          disabled={loading || items.length === 0}
          id="confirm-payment-btn"
        >
          {loading ? (
            <span className="payment-confirm-btn__loading">
              <span className="spinner-small"></span> Memproses...
            </span>
          ) : (
            `✅ Konfirmasi Pembayaran - Rp ${totalPrice.toLocaleString('id-ID')}`
          )}
        </button>
      </div>
    </div>
  );
}
