import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './MenuManagerPage.css';

export default function MenuManagerPage() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [emojiImage, setEmojiImage] = useState('🍽️');

  const navigate = useNavigate();

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const res = await api.get('/menu/all');
      setMenus(res.data);
    } catch (err) {
      console.error('Failed to fetch menus:', err);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setName('');
    setCategory('Makanan');
    setPrice('');
    setDescription('');
    setImageFile(null);
    setImagePreview(null);
    setEmojiImage('🍽️');
    setEditingId(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (menu) => {
    setEditingId(menu._id);
    setName(menu.name);
    setCategory(menu.category);
    setPrice(menu.price.toString());
    setDescription(menu.description || '');
    setImageFile(null);
    
    // Check if it's an emoji or an uploaded image
    if (menu.imageData) {
      setImagePreview(`${api.defaults.baseURL}/menu/${menu._id}/image`);
    } else {
      setImagePreview(null);
      setEmojiImage(menu.image || '🍽️');
    }
    
    setIsModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('description', description);
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (!imagePreview && !editingId) {
        // If no file and no preview on NEW item, use the emoji
        formData.append('image', emojiImage);
      } else if (!imagePreview && editingId) {
        // If they cleared the image to go back to an emoji
        formData.append('image', emojiImage);
        formData.append('removeImage', 'true');
      }

      if (editingId) {
        await api.put(`/menu/${editingId}`, formData);
      } else {
        await api.post('/menu', formData);
      }

      await fetchMenus();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save menu:', err);
      console.error('Error Details:', err.response?.data || err.message);
      alert('Gagal menyimpan menu. Cek console.');
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Yakin ingin menghapus menu "${name}"?`)) {
      try {
        await api.delete(`/menu/${id}`);
        setMenus(menus.filter(m => m._id !== id));
      } catch (err) {
        console.error('Failed to delete menu', err);
        alert('Gagal menghapus menu.');
      }
    }
  };

  return (
    <div className="menu-manager">
      <header className="menu-manager__header">
        <div>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', marginBottom: '8px', fontWeight: 'bold' }}>
            ← Kembali
          </button>
          <h1 className="menu-manager__title">👨‍💼 Owner Menu Manager</h1>
        </div>
        <button className="menu-manager__add-btn" onClick={handleOpenAddModal}>
          + Tambah Menu Baru
        </button>
      </header>

      {loading ? (
        <div className="menu-manager__loading">Memuat daftar menu...</div>
      ) : menus.length === 0 ? (
        <div className="menu-manager__loading">Belum ada menu yang ditambahkan.</div>
      ) : (
        <div className="menu-manager__grid">
          {menus.map(menu => (
            <div key={menu._id} className="menu-manager__card">
              <div className="menu-manager__card-img">
                {menu.imageData ? (
                  <img src={`${api.defaults.baseURL}/menu/${menu._id}/image`} alt={menu.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  menu.image || '🍽️'
                )}
              </div>
              <div className="menu-manager__card-body">
                <span className="menu-manager__card-cat">{menu.category}</span>
                <h3 className="menu-manager__card-name">{menu.name}</h3>
                <p className="menu-manager__card-desc">{menu.description || 'Tidak ada deskripsi'}</p>
                <div className="menu-manager__card-price">Rp {menu.price.toLocaleString('id-ID')}</div>
                
                <div className="menu-manager__card-actions">
                  <button className="menu-manager__btn menu-manager__btn--edit" onClick={() => handleOpenEditModal(menu)}>
                    ✏️ Edit
                  </button>
                  <button className="menu-manager__btn menu-manager__btn--delete" onClick={() => handleDelete(menu._id, menu.name)}>
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="menu-manager__modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="menu-manager__modal" onClick={e => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Menu' : 'Tambah Menu Baru'}</h2>
            
            <form className="menu-manager__form" onSubmit={handleSubmit}>
              <div className="menu-manager__form-group">
                <label>Foto Menu</label>
                <div className="menu-manager__img-preview">
                  {imagePreview ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                        }}
                        style={{
                          position: 'absolute', top: 8, right: 8,
                          background: 'rgba(239, 68, 68, 0.9)', color: 'white',
                          border: 'none', borderRadius: '8px', padding: '6px 12px',
                          cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem'
                        }}
                      >
                        Hapus Foto
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '4rem' }}>{emojiImage}</span>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                />
                {!imagePreview && (
                  <input 
                    type="text" 
                    placeholder="Atau masukkan Emoji (contoh: 🍕)" 
                    value={emojiImage} 
                    onChange={e => setEmojiImage(e.target.value)}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>

              <div className="menu-manager__form-group">
                <label>Nama Menu</label>
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Contoh: Nasi Goreng Spesial"
                />
              </div>

              <div className="menu-manager__form-group">
                <label>Kategori</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Dessert">Dessert</option>
                </select>
              </div>

              <div className="menu-manager__form-group">
                <label>Harga (Rp)</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  value={price} 
                  onChange={e => setPrice(e.target.value)} 
                  placeholder="Contoh: 25000"
                />
              </div>

              <div className="menu-manager__form-group">
                <label>Deskripsi (Opsional)</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Contoh: Nasi dengan telur mata sapi dan ayam suwir..."
                />
              </div>

              <div className="menu-manager__modal-actions">
                <button type="button" className="menu-manager__cancel-btn" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  Batal
                </button>
                <button type="submit" className="menu-manager__save-btn" disabled={isSubmitting || !name || !price}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
