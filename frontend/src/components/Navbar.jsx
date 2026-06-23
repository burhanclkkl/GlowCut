import React from 'react';
import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <img src="/logo.png" className="brand-logo-img" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} alt="GlowCut" />
          <span className="logo-text">Glow<span className="accent">Cut</span></span>
        </Link>
        
        <ul className="navbar-menu">
          <li><a href="#features" className="navbar-link">Özellikler</a></li>
          <li><a href="#comparison" className="navbar-link">Karşılaştırma</a></li>
          <li><a href="#testimonials" className="navbar-link">Yorumlar</a></li>
          <li><a href="#pricing" className="navbar-link">Fiyatlandırma</a></li>
          <li><a href="#faq" className="navbar-link">SSS</a></li>
        </ul>
        
        <div className="navbar-actions">
          <a href="mailto:support@glowcut.com" className="btn btn-secondary">İletişime Geç</a>
          <Link to="/login" className="btn btn-primary">Giriş Yap</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
