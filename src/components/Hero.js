import React from 'react';
import './Hero.css';

const defaultContent = {
  hero: {
    title: 'Toko Mahar Custom yang Rapi, Cepat, dan Siap Pesan',
    description:
      'Sakura Mahar fokus menjual bingkai mahar, isian mahar, aksesoris, dan packing wajib dengan tampilan elegan serta proses pemesanan yang simpel.',
    badge: 'Mahar Custom & Aksesoris',
    primaryButtonLabel: 'Lihat Produk',
    secondaryButtonLabel: 'Cara Pesan',
    imageUrl: ''
  },
  heroStats: [
    { id: 1, value: '500+', label: 'Produk & Variasi' },
    { id: 2, value: '1K+', label: 'Pesanan Selesai' },
    { id: 3, value: '4.9/5', label: 'Rating Pelanggan' }
  ]
};

const Hero = ({ content = defaultContent, onPrimaryAction, onSecondaryAction }) => {
  const safeContent = content && typeof content === 'object' ? content : {};
  const hero = safeContent.hero && typeof safeContent.hero === 'object'
    ? { ...defaultContent.hero, ...safeContent.hero }
    : defaultContent.hero;
  const heroStats = Array.isArray(safeContent.heroStats) && safeContent.heroStats.length
    ? safeContent.heroStats
    : defaultContent.heroStats;

  return (
    <section className="hero" id="home">
      <div className="container hero-content">
        <div className="hero-text">
          {hero.badge && <span className="hero-badge">{hero.badge}</span>}
          <h1>{hero.title}</h1>
          <p>{hero.description}</p>
          <div className="hero-buttons">
            <button className="btn-primary" type="button" onClick={onPrimaryAction}>
              {hero.primaryButtonLabel}
            </button>
            <button className="btn-secondary" type="button" onClick={onSecondaryAction}>
              {hero.secondaryButtonLabel}
            </button>
          </div>
          <div className="hero-stats">
            {heroStats.map((stat) => (
              <div key={stat.id || stat.label} className="stat">
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-image">
          {hero.imageUrl ? (
            <img className="hero-media" src={hero.imageUrl} alt={hero.title} />
          ) : (
            <div className="image-placeholder">
              <i className="fas fa-gem"></i>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
