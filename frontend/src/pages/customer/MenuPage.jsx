import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import MenuCard from '../../components/MenuCard';
import './MenuPage.css';

const categories = ['Semua', 'Makanan', 'Minuman', 'Dessert'];

export default function MenuPage() {
  const [menu, setMenu] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestInput, setGuestInput] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { tableNumber } = useParams();
  const { items: cartItems, itemCount, totalPrice, addItem, removeItem } = useCart();

  useEffect(() => {
    if (!tableNumber || isNaN(tableNumber)) {
      navigate('/');
      return;
    }
    // Store table in localStorage for payment page
    localStorage.setItem('ichef-table', tableNumber);

    const savedGuestCount = localStorage.getItem(`ichef-guest-count-${tableNumber}`);
    if (!savedGuestCount) {
      setShowGuestModal(true);
      setLoading(false); // don't show loading spinner under modal
    } else {
      fetchMenu();
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [tableNumber]);

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    if (guestInput && parseInt(guestInput) > 0) {
      localStorage.setItem(`ichef-guest-count-${tableNumber}`, guestInput);
      setShowGuestModal(false);
      setLoading(true);
      fetchMenu();
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await api.get('/menu');
      setMenu(res.data);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    }
    setLoading(false);
  };

  const filteredMenu = activeCategory === 'Semua'
    ? menu
    : menu.filter(item => item.category === activeCategory);

  const getItemQuantity = (menuId) => {
    const cartItem = cartItems.find(item => item.menuItem._id === menuId);
    return cartItem ? cartItem.quantity : 0;
  };

  if (showGuestModal) {
    return (
      <div className="menu-page__guest-modal">
        <div className="menu-page__guest-card">
          <h2>Berapa Orang?</h2>
          <p>Silakan masukkan jumlah tamu di meja ini</p>
          <form onSubmit={handleGuestSubmit}>
            <input
              type="number"
              min="1"
              max="50"
              value={guestInput}
              onChange={(e) => setGuestInput(e.target.value)}
              placeholder="Contoh: 2"
              required
              autoFocus
            />
            <button type="submit" className="menu-page__guest-btn" disabled={!guestInput || guestInput < 1}>
              Lanjut ke Menu
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      {/* Header */}
      <header className="menu-page__header">
        <div className="menu-page__header-left">
          <div>
            <h1 className="menu-page__title">Menu</h1>
            <p className="menu-page__table" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🪑 Meja {tableNumber}</span>
              <span style={{ color: 'var(--border-color)' }}>|</span>
              <span style={{ fontSize: '0.75rem' }}>{currentTime.toLocaleTimeString('id-ID', { hour12: false })}</span>
            </p>
          </div>
        </div>
        <div className="menu-page__cart-icon" onClick={() => itemCount > 0 && navigate(`/table/${tableNumber}/payment`)}>
          🛒
          {itemCount > 0 && <span className="menu-page__cart-badge">{itemCount}</span>}
        </div>
      </header>

      {/* Category Tabs */}
      <div className="menu-page__tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`menu-page__tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="menu-page__content">
        {loading ? (
          <div className="menu-page__loading">
            <div className="spinner"></div>
            <p>Memuat menu...</p>
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="menu-page__empty">
            <p>😕 Tidak ada menu di kategori ini</p>
          </div>
        ) : (
          <div className="menu-page__grid">
            {filteredMenu.map(item => (
              <MenuCard
                key={item._id}
                item={item}
                quantity={getItemQuantity(item._id)}
                onAdd={addItem}
                onRemove={removeItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Bar */}
      {itemCount > 0 && (
        <div className="menu-page__cart-bar" onClick={() => navigate(`/table/${tableNumber}/payment`)}>
          <div className="menu-page__cart-info">
            <span className="menu-page__cart-count">{itemCount} item</span>
            <span className="menu-page__cart-total">
              Rp {totalPrice.toLocaleString('id-ID')}
            </span>
          </div>
          <span className="menu-page__cart-btn">Checkout →</span>
        </div>
      )}
    </div>
  );
}
