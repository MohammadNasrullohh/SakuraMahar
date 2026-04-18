import React from 'react';
import './Testimonials.css';

const defaultTestimonials = [
    {
      id: 1,
      name: 'Ayu & Rizki',
      role: 'Pembeli Bingkai Mahar',
      image: '👰',
      text: 'Frame mahar yang kami pesan rapi banget, warnanya sesuai request, dan hasil akhirnya terlihat mewah.',
      highlight: 'Custom desainnya jelas dan hasilnya memuaskan.'
    },
    {
      id: 2,
      name: 'Siti & Ahmad',
      role: 'Pembeli Box Mahar',
      image: '💒',
      text: 'Adminnya responsif, box mahar datang cepat, dan detail bunga serta ornamen sesuai foto referensi.',
      highlight: 'Komunikasi enak dan pengerjaan cepat.'
    },
    {
      id: 3,
      name: 'Nadia & Irfan',
      role: 'Pembeli Produk Custom',
      image: '💕',
      text: 'Kami pesan beberapa item sekaligus, dari isian mahar sampai packing kayu, semuanya tercatat dan follow-up-nya rapi.',
      highlight: 'Cocok untuk yang ingin pesan beberapa item dalam satu tempat.'
    },
    {
      id: 4,
      name: 'Rina & Budi',
      role: 'Pembeli Aksesoris Mahar',
      image: '🎊',
      text: 'Tambahan bunga dan replika logam emasnya bikin hasil mahar jauh lebih cantik saat dipajang.',
      highlight: 'Aksesoris kecilnya justru bikin hasil akhirnya naik kelas.'
    }
  ];

const Testimonials = ({ items = defaultTestimonials, onNavigate }) => {
  const testimonials = Array.isArray(items) && items.length ? items : defaultTestimonials;

  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <div className="testimonial-header-bar">
          <div>
            <p className="testimonial-label">Testimoni Pengguna</p>
            <h2 className="section-title">Dipercaya oleh Pembeli Produk Mahar</h2>
          </div>
          <div className="testimonial-cta">
            <span>Siap pilih produk mahar yang sesuai kebutuhan Anda?</span>
            <a
              className="btn-primary"
              href="#services"
              onClick={(event) => {
                event.preventDefault();
                onNavigate?.('services');
              }}
            >
              Lihat Produk
            </a>
          </div>
        </div>

        <div className="testimonials-grid">
          {testimonials.map(testimonial => (
            <div key={testimonial.id} className="testimonial-card">
              <div className="testimonial-topline">
                <span className="testimonial-quote">“</span>
                <div className="testimonial-stars" aria-label="5-star review">⭐⭐⭐⭐⭐</div>
              </div>
              <p className="testimonial-text">{testimonial.text}</p>
              <p className="testimonial-highlight">{testimonial.highlight}</p>

              <div className="testimonial-owner">
                <div className="avatar">{testimonial.image}</div>
                <div>
                  <h4>{testimonial.name}</h4>
                  <p>{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
