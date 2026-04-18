import React from 'react';
import './HowItWorks.css';

const steps = [
  {
    id: 1,
    title: 'Pilih Produk',
    description: 'Telusuri kategori produk seperti model bingkai mahar, isian mahar, dan packing wajib.',
    icon: 'fa-clipboard-list'
  },
  {
    id: 2,
    title: 'Tentukan Detail Custom',
    description: 'Pilih nama pasangan, warna, tambahan bunga, dan request khusus sesuai model yang diinginkan.',
    icon: 'fa-pen-ruler'
  },
  {
    id: 3,
    title: 'Kirim Order ke Admin',
    description: 'Lanjutkan via checkout, form kontak, atau WhatsApp agar tim kami bisa memproses pesanan Anda.',
    icon: 'fa-paper-plane'
  },
  {
    id: 4,
    title: 'Produksi & Pengiriman',
    description: 'Admin menindaklanjuti order, mengonfirmasi detail, lalu produk diproses dan dikirim.',
    icon: 'fa-truck-fast'
  }
];

const HowItWorks = () => (
  <section className="how-it-works" id="how-it-works">
    <div className="container">
      <div className="section-header">
        <span className="section-label">Cara Kerja</span>
        <h2 className="section-title">4 Langkah Mudah Memesan Produk Mahar</h2>
        <p className="section-subtitle">
          Alur Sakura Mahar dibuat sederhana agar pelanggan bisa cepat memilih produk, request custom, lalu checkout dengan jelas.
        </p>
      </div>

      <div className="workflow-grid">
        {steps.map((step) => (
          <div key={step.id} className="workflow-card">
            <div className="workflow-icon">
              <i className={`fas ${step.icon}`}></i>
            </div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            <span className="workflow-step">Langkah {step.id}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
