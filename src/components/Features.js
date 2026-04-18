import React from 'react';
import './Features.css';

const defaultFeatures = [
    {
      id: 1,
      icon: 'fa-store',
      title: 'Katalog Produk Jelas',
      description: 'Produk dibagi per kategori seperti model bingkai, isian mahar, dan packing wajib agar lebih mudah dipilih.'
    },
    {
      id: 2,
      icon: 'fa-pen-ruler',
      title: 'Bisa Custom Desain',
      description: 'Nama pasangan, warna bunga, layout bingkai, dan detail hiasan bisa disesuaikan dengan kebutuhan.'
    },
    {
      id: 3,
      icon: 'fa-bolt',
      title: 'Pengerjaan Cepat',
      description: 'Tersedia produk ready order dan opsi pengerjaan express untuk kebutuhan mendadak.'
    },
    {
      id: 4,
      icon: 'fa-box-open',
      title: 'Packing Aman',
      description: 'Tambahan packing kayu dan proteksi pengiriman membantu produk sampai dengan lebih aman.'
    },
    {
      id: 5,
      icon: 'fa-comments',
      title: 'Konsultasi Langsung',
      description: 'Pelanggan bisa langsung tanya detail produk, request custom, dan follow-up order lewat WhatsApp atau form.'
    },
    {
      id: 6,
      icon: 'fa-lock',
      title: 'Order Tercatat Rapi',
      description: 'Setiap pesanan ditangani dengan rapi sehingga proses konfirmasi, revisi, dan pengerjaan terasa lebih tenang.'
    }
  ];

const Features = ({ items = defaultFeatures }) => {
  const features = Array.isArray(items) && items.length ? items : defaultFeatures;

  return (
    <section className="features" id="features">
      <div className="container">
        <h2 className="section-title">Kenapa Pilih Sakura Mahar</h2>
        <p className="section-subtitle">Fokus pada mahar custom yang elegan, aksesoris pendukung, dan pelayanan yang nyaman dari awal sampai pesanan siap</p>
        
        <div className="features-grid">
          {features.map((feature) => (
            <div key={feature.id || feature.title} className="feature-card">
              <div className="feature-icon">
                <i className={`fas ${feature.icon}`}></i>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
