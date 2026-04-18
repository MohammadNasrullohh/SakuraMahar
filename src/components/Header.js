import React from 'react';
import './Header.css';

const Header = ({
  isMenuOpen,
  setIsMenuOpen,
  onLoginClick,
  onSignupClick,
  user,
  onLogout,
  isAuthChecking,
  isAdmin,
  onAdminClick,
  onChangePasswordClick,
  branding,
  onNavigate
}) => {
  const brand = {
    brandName: 'Sakura Mahar',
    logoUrl: '',
    logoAlt: 'Logo Sakura Mahar',
    logoIconClass: 'fas fa-cherry',
    ...(branding || {})
  };

  const handleNavigate = (sectionId) => (event) => {
    event.preventDefault();
    setIsMenuOpen(false);
    onNavigate?.(sectionId);
  };

  return (
    <header className="header">
      <div className="container header-content">
        <a className="logo" href="#home" onClick={handleNavigate('home')}>
          <div className="logo-mark" aria-hidden="true">
            {brand.logoUrl ? (
              <img className="logo-image" src={brand.logoUrl} alt={brand.logoAlt || brand.brandName} />
            ) : (
              <i className={brand.logoIconClass || 'fas fa-cherry'}></i>
            )}
          </div>
          <div className="logo-copy">
            <span className="logo-wordmark">{brand.brandName}</span>
            <span className="logo-tagline">Mahar Custom & Aksesoris</span>
          </div>
        </a>
        
        <nav className={`nav ${isMenuOpen ? 'active' : ''}`}>
          <a href="#home" onClick={handleNavigate('home')}>Beranda</a>
          <a href="#features" onClick={handleNavigate('features')}>Fitur</a>
          <a href="#how-it-works" onClick={handleNavigate('how-it-works')}>Cara Kerja</a>
          <a href="#services" onClick={handleNavigate('services')}>Produk</a>
          <a href="#testimonials" onClick={handleNavigate('testimonials')}>Testimoni</a>
          <a href="#faq" onClick={handleNavigate('faq')}>FAQ</a>
          <a href="#contact" onClick={handleNavigate('contact')}>Hubungi Kami</a>
        </nav>

        <div className="header-actions">
          {user ? (
            <div className="user-info">
              <div className="user-meta">
                <span className="user-meta-label">Akun Aktif</span>
                <strong className="user-meta-name">{user.nama || user.email}</strong>
              </div>
              <div className="user-buttons">
                <button className="btn-login btn-login-compact" onClick={onChangePasswordClick}>Ubah Password</button>
                {isAdmin && <button className="btn-admin" onClick={onAdminClick}>Panel Admin</button>}
                <button className="btn-logout" onClick={onLogout}>Keluar</button>
              </div>
            </div>
          ) : isAuthChecking ? (
            <button className="btn-login" type="button" disabled>Memuat akun...</button>
          ) : (
            <div className="guest-actions">
              <button className="btn-login" onClick={onLoginClick}>Masuk</button>
              <button className="btn-signup" onClick={onSignupClick}>Daftar</button>
            </div>
          )}
          <button 
            className="hamburger"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
