import React from 'react';
import './Footer.css';

const defaultContent = {
  about:
    'Toko mahar custom yang fokus pada bingkai mahar, isian, aksesoris, dan packing wajib dengan proses order yang rapi.',
  helpLinks: [
    { id: 1, label: 'FAQ', url: '#faq' },
    { id: 2, label: 'Tutorial', url: '#services' },
    { id: 3, label: 'Testimoni', url: '#testimonials' },
    { id: 4, label: 'Hubungi Kami', url: '#contact' }
  ],
  socials: [
    { id: 1, platform: 'Facebook', icon: 'fab fa-facebook', url: 'https://facebook.com' },
    { id: 2, platform: 'Instagram', icon: 'fab fa-instagram', url: 'https://instagram.com' },
    { id: 3, platform: 'LinkedIn', icon: 'fab fa-linkedin', url: 'https://linkedin.com' },
    { id: 4, platform: 'WhatsApp', icon: 'fab fa-whatsapp', url: 'https://wa.me/6281234567890' }
  ]
};

const defaultContact = {
  phone: '+62 812 3456 7890',
  email: 'info@sakuramahar.com',
  address: 'Jakarta, Indonesia'
};

const Footer = ({ content = defaultContent, contact = defaultContact, branding, onNavigate }) => {
  const currentYear = new Date().getFullYear();
  const safeContent = content && typeof content === 'object' ? content : {};
  const safeContact = contact && typeof contact === 'object' ? contact : {};
  const brand = {
    brandName: 'Sakura Mahar',
    logoUrl: '',
    logoAlt: 'Logo Sakura Mahar',
    logoIconClass: 'fas fa-cherry',
    ...(branding || {})
  };
  const footer = {
    ...defaultContent,
    ...safeContent,
    helpLinks: Array.isArray(safeContent.helpLinks) && safeContent.helpLinks.length
      ? safeContent.helpLinks
      : defaultContent.helpLinks,
    socials: Array.isArray(safeContent.socials) && safeContent.socials.length
      ? safeContent.socials
      : defaultContent.socials
  };
  const contactInfo = {
    ...defaultContact,
    ...safeContact
  };
  const renderLink = (label, url, key) => {
    const isInternalAnchor = typeof url === 'string' && url.startsWith('#');

    if (!isInternalAnchor) {
      return (
        <li key={key}>
          <a href={url}>{label}</a>
        </li>
      );
    }

    const sectionId = url.replace(/^#/, '');

    return (
      <li key={key}>
        <a
          href={url}
          onClick={(event) => {
            event.preventDefault();
            onNavigate?.(sectionId);
          }}
        >
          {label}
        </a>
      </li>
    );
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-brand">
              <div className="footer-brand-mark" aria-hidden="true">
                {brand.logoUrl ? (
                  <img className="footer-brand-image" src={brand.logoUrl} alt={brand.logoAlt || brand.brandName} />
                ) : (
                  <i className={brand.logoIconClass || 'fas fa-cherry'}></i>
                )}
              </div>
              <h3>{brand.brandName}</h3>
            </div>
            <p>{footer.about}</p>
          </div>

          <div className="footer-section">
            <h4>Menu Utama</h4>
            <ul>
              {renderLink('Beranda', '#home', 'footer-home')}
              {renderLink('Fitur', '#features', 'footer-features')}
              {renderLink('Cara Kerja', '#how-it-works', 'footer-how-it-works')}
              {renderLink('Produk', '#services', 'footer-services')}
              {renderLink('Testimoni', '#testimonials', 'footer-testimonials')}
              {renderLink('Kontak', '#contact', 'footer-contact')}
            </ul>
          </div>

          <div className="footer-section">
            <h4>Bantuan</h4>
            <ul>
              {footer.helpLinks.map((link) => (
                renderLink(link.label, link.url, link.id || link.label)
              ))}
            </ul>
          </div>

          <div className="footer-section">
            <h4>Kontak</h4>
            <ul className="contact-list">
              <li><i className="fas fa-phone"></i> {contactInfo.phone}</li>
              <li><i className="fas fa-envelope"></i> {contactInfo.email}</li>
              <li><i className="fas fa-map-marker-alt"></i> {contactInfo.address}</li>
            </ul>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>&copy; {currentYear} {brand.brandName}. Semua hak dilindungi.</p>
          </div>
          <div className="footer-socials">
            {footer.socials.map((social) => (
              <a key={social.id || social.platform} href={social.url} target="_blank" rel="noreferrer" aria-label={social.platform}>
                <i className={social.icon}></i>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
