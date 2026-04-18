import React, { useEffect, useMemo, useState } from 'react';
import './Contact.css';
import { sendContactMessage } from '../services/siteService';
import { buildPackageInquiryText } from '../utils/checkoutContent';

const defaultContent = {
  title: 'Hubungi Kami',
  description:
    'Punya pertanyaan atau ingin pesan produk mahar? Kirim pesan melalui formulir, WhatsApp, atau email, dan tim kami akan segera membantu Anda.',
  phone: '+62 812 3456 7890',
  email: 'info@sakuramahar.com',
  address: 'Jakarta, Indonesia',
  hours: 'Senin - Jumat: 09:00 - 18:00',
  socials: [
    { id: 1, platform: 'Facebook', icon: 'fab fa-facebook', url: 'https://facebook.com' },
    { id: 2, platform: 'Instagram', icon: 'fab fa-instagram', url: 'https://instagram.com' },
    { id: 3, platform: 'WhatsApp', icon: 'fab fa-whatsapp', url: 'https://wa.me/6281234567890' },
    { id: 4, platform: 'TikTok', icon: 'fab fa-tiktok', url: 'https://tiktok.com' }
  ]
};

const Contact = ({
  content = defaultContent,
  brandName = 'Sakura Mahar',
  inquiryContext = null,
  onInquiryHandled
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const safeContent = content && typeof content === 'object' ? content : {};
  const contact = {
    ...defaultContent,
    ...safeContent,
    socials: Array.isArray(safeContent.socials) && safeContent.socials.length
      ? safeContent.socials
      : defaultContent.socials
  };
  const activeInquiry = useMemo(
    () =>
      inquiryContext && typeof inquiryContext === 'object' && inquiryContext.name
        ? inquiryContext
        : null,
    [inquiryContext]
  );

  useEffect(() => {
    if (!activeInquiry) {
      return;
    }

    setFormData((current) => ({
      ...current,
      message:
        current.message && current.message.includes(activeInquiry.name)
          ? current.message
          : buildPackageInquiryText(activeInquiry, brandName)
    }));
  }, [activeInquiry, brandName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await sendContactMessage({
        nama: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        noTelepon: formData.phone.trim(),
        subjek: activeInquiry
          ? `Konsultasi Produk ${activeInquiry.name} - ${brandName}`
          : `Pesan dari website ${brandName}`,
        pesan: formData.message.trim()
      });

      setStatus({
        type: 'success',
        message: response.message || 'Pesan Anda telah dikirim.'
      });
      setFormData({ name: '', email: '', phone: '', message: '' });
      onInquiryHandled?.();
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Pesan gagal dikirim.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="contact" id="contact">
      <div className="container contact-content">
        <div className="contact-info">
          <p className="contact-eyebrow">Konsultasi Sakura Mahar</p>
          <h2>{contact.title}</h2>
          <p>{contact.description}</p>
          
          <div className="contact-details">
            <div className="contact-item">
              <i className="fas fa-phone"></i>
              <div>
                <h4>Telepon</h4>
                <p>{contact.phone}</p>
              </div>
            </div>
            <div className="contact-item">
              <i className="fas fa-envelope"></i>
              <div>
                <h4>Email</h4>
                <p>{contact.email}</p>
              </div>
            </div>
            <div className="contact-item">
              <i className="fas fa-map-marker-alt"></i>
              <div>
                <h4>Alamat</h4>
                <p>{contact.address}</p>
              </div>
            </div>
            <div className="contact-item">
              <i className="fas fa-clock"></i>
              <div>
                <h4>Jam Operasional</h4>
                <p>{contact.hours}</p>
              </div>
            </div>
          </div>

          <div className="social-links">
            {contact.socials.map((social) => (
              <a key={social.id || social.platform} href={social.url} target="_blank" rel="noreferrer" aria-label={social.platform}>
                <i className={social.icon}></i>
              </a>
            ))}
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <h3>Kirim Pesan</h3>
          {activeInquiry && (
            <div className="contact-inquiry-banner">
              <div>
                <span className="contact-inquiry-badge">Produk Pilihan</span>
                <strong>{activeInquiry.name}</strong>
                <p>
                  {[activeInquiry.price, activeInquiry.duration].filter(Boolean).join(' • ') ||
                    'Konsultasi untuk produk ini akan langsung kami teruskan ke tim Sakura Mahar.'}
                </p>
              </div>
              <button
                type="button"
                className="contact-inquiry-clear"
                onClick={() => {
                  onInquiryHandled?.();
                  setFormData((current) => ({ ...current, message: '' }));
                }}
              >
                Hapus produk
              </button>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="name">Nama Lengkap</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Masukkan nama Anda"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Masukkan email Anda"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Nomor Telepon</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Masukkan nomor telepon"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Pesan</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              placeholder="Tulis pesan Anda di sini"
              rows="5"
            ></textarea>
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Mengirim...' : 'Kirim Pesan'}
          </button>

          {status.message && (
            <div className={`contact-feedback ${status.type}`}>
              {status.message}
            </div>
          )}
        </form>
      </div>
    </section>
  );
};

export default Contact;
