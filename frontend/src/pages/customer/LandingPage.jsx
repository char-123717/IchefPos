import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const [tableNumber, setTableNumber] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const num = parseInt(tableNumber);

    if (!num || num < 1 || num > 50) {
      setError('Masukkan nomor meja yang valid (1-50)');
      return;
    }

    localStorage.setItem('ichef-table', num);
    navigate('/menu');
  };

  return (
    <div className="landing">
      <div className="landing__bg-glow"></div>

      <div className="landing__content">
        <div className="landing__logo">
          <span className="landing__logo-icon">🍳</span>
          <h1 className="landing__title">iChef</h1>
          <p className="landing__subtitle">POS System</p>
        </div>

        <div className="landing__card">
          <h2 className="landing__card-title">Selamat Datang!</h2>
          <p className="landing__card-desc">
            Masukkan nomor meja Anda untuk mulai memesan
          </p>

          <form onSubmit={handleSubmit} className="landing__form">
            <div className="landing__input-group">
              <label htmlFor="table-input" className="landing__label">
                Nomor Meja
              </label>
              <input
                id="table-input"
                type="number"
                min="1"
                max="50"
                value={tableNumber}
                onChange={(e) => {
                  setTableNumber(e.target.value);
                  setError('');
                }}
                placeholder="contoh: 5"
                className="landing__input"
                autoFocus
              />
              {error && <p className="landing__error">{error}</p>}
            </div>

            <button type="submit" className="landing__btn" id="start-order-btn">
              🍽️ Mulai Pesan
            </button>
          </form>
        </div>

        <p className="landing__footer">
          Powered by <strong>iChef</strong> • Smart Restaurant System
        </p>
      </div>
    </div>
  );
}
