import React from 'react';
import './FAQ.css';

const faqItems = [
  {
    id: 1,
    question: 'Apakah semua produk bisa dicustom?',
    answer: 'Sebagian besar produk bisa dicustom untuk nama pasangan, warna, bunga, atau detail layout. Detail custom akan dikonfirmasi admin setelah order masuk.'
  },
  {
    id: 2,
    question: 'Bagaimana cara pesan produk di Sakura Mahar?',
    answer: 'Pilih produk yang Anda suka, lalu lanjutkan pemesanan melalui tombol pesan, form kontak, atau WhatsApp kami.'
  },
  {
    id: 3,
    question: 'Apakah ada opsi packing aman untuk pengiriman?',
    answer: 'Ya. Tersedia packing wajib seperti packing kayu dan proteksi tambahan agar produk lebih aman saat dikirim.'
  },
  {
    id: 4,
    question: 'Apakah bisa order mendadak atau express?',
    answer: 'Beberapa produk tersedia dengan proses cepat. Hubungi kami untuk memastikan slot produksi dan estimasi kirim terbaru.'
  }
];

const FAQ = () => (
  <section className="faq" id="faq">
    <div className="container">
      <div className="faq-header">
        <div>
          <span className="faq-label">Pertanyaan Umum</span>
          <h2 className="section-title">FAQ - Jawaban Cepat untuk Anda</h2>
        </div>
        <p className="faq-copy">
          Temukan jawaban singkat untuk pertanyaan paling sering diajukan pelanggan sebelum memesan produk mahar custom.
        </p>
      </div>

      <div className="faq-grid">
        {faqItems.map((item) => (
          <details key={item.id} className="faq-card">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

export default FAQ;
