import React from 'react';
import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-glow"></div>
      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/" className="footer-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <img src="/logo.png" className="brand-logo-img" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} alt="GlowCut" />
            <span className="logo-text">Glow<span className="accent">Cut</span></span>
          </Link>
          <p className="footer-description">
            Akıllı Kuaför Randevu ve Müşteri Yönetimi ile Salonunuzu Büyütün. Stilistler ve salon sahipleri için çakışmasız, esnek ve pratik planlama ajandası.
          </p>
        </div>

        <div className="footer-contact">
          <h4>İletişim</h4>
          <p>Destek, soru ve ortaklık talepleriniz için bize ulaşın:</p>
          <a href="mailto:support@glowcut.com" className="footer-email">support@glowcut.com</a>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>&copy; {new Date().getFullYear()} GlowCut. Tüm hakları saklıdır.</p>
          <div className="footer-legal">
            <Link to="/privacy">Gizlilik Politikası</Link>
            <Link to="/terms">Kullanım Şartları</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
