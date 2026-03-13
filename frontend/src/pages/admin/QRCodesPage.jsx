import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './QRCodesPage.css';

export default function QRCodesPage() {
  const [tableCount, setTableCount] = useState(10);
  const baseUrl = window.location.origin;

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="qr-page">
      <header className="qr-page__header no-print">
        <div>
          <h1 className="qr-page__title">📱 QR Code Generator</h1>
          <p className="qr-page__subtitle">Cetak QR code untuk setiap meja</p>
        </div>
        <div className="qr-page__controls">
          <label className="qr-page__label">
            Jumlah Meja:
            <input
              type="number"
              min="1"
              max="50"
              value={tableCount}
              onChange={(e) => setTableCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              className="qr-page__input"
            />
          </label>
          <button className="qr-page__print-btn" onClick={handlePrint}>
            🖨️ Print QR Codes
          </button>
        </div>
      </header>

      <div className="qr-page__grid">
        {tables.map(num => (
          <div key={num} className="qr-card">
            <div className="qr-card__code">
              <QRCodeSVG
                value={`${baseUrl}/table/${num}`}
                size={160}
                bgColor="#ffffff"
                fgColor="#0A0A0F"
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="qr-card__info">
              <h3 className="qr-card__table">Meja {num}</h3>
              <p className="qr-card__url">/table/{num}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
