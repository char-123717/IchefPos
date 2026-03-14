import api from '../services/api';
import './MenuCard.css';

export default function MenuCard({ item, quantity = 0, onAdd, onRemove }) {
  return (
    <div className="menu-card">
      <div className="menu-card__image">
        {item.imageData ? (
          <img 
            src={`${api.defaults.baseURL}/menu/${item._id}/image`} 
            alt={item.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} 
          />
        ) : (
          <span>{item.image || '🍽️'}</span>
        )}
      </div>
      <div className="menu-card__info">
        <h3 className="menu-card__name">{item.name}</h3>
        <p className="menu-card__desc">{item.description}</p>
        <p className="menu-card__price">
          Rp {item.price.toLocaleString('id-ID')}
        </p>
      </div>
      <div className="menu-card__actions">
        {quantity > 0 ? (
          <div className="menu-card__qty-controls">
            <button className="qty-btn qty-btn--minus" onClick={() => onRemove(item._id)}>−</button>
            <span className="qty-value">{quantity}</span>
            <button className="qty-btn qty-btn--plus" onClick={() => onAdd(item)}>+</button>
          </div>
        ) : (
          <button className="add-btn" onClick={() => onAdd(item)}>
            + Tambah
          </button>
        )}
      </div>
    </div>
  );
}
