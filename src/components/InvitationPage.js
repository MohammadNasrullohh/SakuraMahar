import React, { useEffect, useMemo, useState } from 'react';
import './InvitationPage.css';
import {
  fetchInvitationByCode,
  fetchSiteContent,
  submitInvitationResponse
} from '../services/siteService';

const calculateCountdown = (targetDate) => {
  if (!targetDate) {
    return null;
  }

  const distance = new Date(targetDate).getTime() - Date.now();

  if (Number.isNaN(distance) || distance <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60)
  };
};

const defaultWedding = {
  coupleTagline: 'The Wedding of',
  brideName: 'Sakura',
  groomName: 'Haru',
  welcomeMessage: 'Dengan penuh sukacita kami mengundang Anda hadir di hari bahagia kami.',
  eventDate: '',
  countdownTarget: '',
  heroImageUrl: '',
  coverImageUrl: '',
  venueName: 'Grand Ballroom Sakura',
  venueAddress: 'Jakarta, Indonesia',
  venueMapUrl: '',
  livestreamUrl: '',
  dressCodeTitle: 'Dress Code',
  dressCodeDescription: 'Busana formal dengan nuansa pastel lembut.',
  dressPalette: ['#f8d7da', '#d9c2f0', '#f7e5c6'],
  giftIntro: 'Doa restu Anda adalah hadiah terindah.',
  gifts: [],
  gallery: [],
  loveStory: [],
  schedule: [],
  notes: []
};

const InvitationPage = ({ code }) => {
  const [invitation, setInvitation] = useState(null);
  const [siteContent, setSiteContent] = useState(null);
  const [form, setForm] = useState({
    response: 'confirmed',
    jumlahOrang: 1,
    menu: '',
    catatan: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    const loadInvitation = async () => {
      setIsLoading(true);

      try {
        const [invitationResponse, siteContentResponse] = await Promise.all([
          fetchInvitationByCode(code),
          fetchSiteContent()
        ]);

        setInvitation(invitationResponse.undangan);
        setSiteContent(siteContentResponse.content || null);
      } catch (error) {
        setStatus({ type: 'error', message: error.message || 'Undangan tidak dapat dimuat.' });
      } finally {
        setIsLoading(false);
      }
    };

    loadInvitation();
  }, [code]);

  const wedding = useMemo(
    () => ({
      ...defaultWedding,
      ...(siteContent?.wedding || {})
    }),
    [siteContent]
  );

  const targetDate = useMemo(
    () => wedding.countdownTarget || wedding.eventDate || invitation?.tanggalPernikahan || '',
    [invitation, wedding]
  );

  useEffect(() => {
    if (!targetDate) {
      setCountdown(null);
      return undefined;
    }

    setCountdown(calculateCountdown(targetDate));
    const timer = window.setInterval(() => {
      setCountdown(calculateCountdown(targetDate));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [targetDate]);

  const eventDate = useMemo(() => {
    const source = invitation?.tanggalPernikahan || wedding.eventDate;

    if (!source) {
      return '-';
    }

    return new Date(source).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [invitation, wedding]);

  const coverImage = wedding.coverImageUrl || wedding.heroImageUrl;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await submitInvitationResponse(code, form);
      setInvitation(response.undangan);
      setStatus({
        type: 'success',
        message: response.message || 'RSVP berhasil dikirim.'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'RSVP gagal dikirim.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="invitation-shell">Memuat undangan...</div>;
  }

  if (!invitation) {
    return (
      <div className="invitation-shell">
        <div className="invitation-card">
          <p className="invitation-eyebrow">Undangan Digital Sakura Mahar</p>
          <h1>Undangan Tidak Ditemukan</h1>
          {status.message && <div className={`invitation-status ${status.type}`}>{status.message}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="invitation-shell invitation-shell-rich">
      <section
        className="invitation-hero"
        style={coverImage ? { backgroundImage: `linear-gradient(rgba(34, 12, 34, 0.48), rgba(34, 12, 34, 0.58)), url(${coverImage})` } : undefined}
      >
        <div className="invitation-hero-inner">
          <p className="invitation-eyebrow">{wedding.coupleTagline}</p>
          <h1>
            {wedding.brideName} <span>&amp;</span> {wedding.groomName}
          </h1>
          <p className="invitation-copy">{wedding.welcomeMessage}</p>
          <div className="invitation-guest-badge">Untuk {invitation.guestNama}</div>
        </div>
      </section>

      <section className="invitation-section invitation-intro-card">
        <div className="invitation-card invitation-card-wide">
          <div className="invitation-detail-grid">
            <div>
              <span>Tanggal</span>
              <strong>{eventDate}</strong>
            </div>
            <div>
              <span>Jam</span>
              <strong>{invitation.jamMulai || '-'}</strong>
            </div>
            <div>
              <span>Lokasi</span>
              <strong>{invitation.tempatPernikahan || wedding.venueName || '-'}</strong>
            </div>
          </div>
          <div className="invitation-action-row">
            {(invitation.linkGoogle || wedding.venueMapUrl) && (
              <a
                className="btn-secondary"
                href={invitation.linkGoogle || wedding.venueMapUrl}
                target="_blank"
                rel="noreferrer"
              >
                Buka Lokasi
              </a>
            )}
            {wedding.livestreamUrl && (
              <a className="btn-primary" href={wedding.livestreamUrl} target="_blank" rel="noreferrer">
                Tonton Live
              </a>
            )}
          </div>
        </div>
      </section>

      {countdown && (
        <section className="invitation-section">
          <div className="invitation-section-heading">
            <p className="invitation-eyebrow">Countdown</p>
            <h2>Hitung Mundur Acara</h2>
          </div>
          <div className="countdown-grid">
            {Object.entries(countdown).map(([key, value]) => (
              <div key={key} className="countdown-card">
                <strong>{value}</strong>
                <span>{key}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {wedding.schedule.length > 0 && (
        <section className="invitation-section">
          <div className="invitation-section-heading">
            <p className="invitation-eyebrow">Schedule</p>
            <h2>Rangkaian Acara</h2>
          </div>
          <div className="invitation-grid two-columns">
            {wedding.schedule.map((item) => (
              <article key={item.id} className="invitation-surface">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="invitation-meta">
                  <span>{item.date || eventDate}</span>
                  <span>{item.time || '-'}</span>
                  <span>{item.location || invitation.tempatPernikahan || wedding.venueName}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {wedding.loveStory.length > 0 && (
        <section className="invitation-section">
          <div className="invitation-section-heading">
            <p className="invitation-eyebrow">Love Story</p>
            <h2>Perjalanan Kami</h2>
          </div>
          <div className="story-list">
            {wedding.loveStory.map((story) => (
              <article key={story.id} className="story-card">
                <span className="story-date">{story.date || 'Momen spesial'}</span>
                <h3>{story.title}</h3>
                <p>{story.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {wedding.gallery.length > 0 && (
        <section className="invitation-section">
          <div className="invitation-section-heading">
            <p className="invitation-eyebrow">Gallery</p>
            <h2>Galeri Momen</h2>
          </div>
          <div className="gallery-grid">
            {wedding.gallery.map((image) => (
              <figure key={image.id} className="gallery-card">
                {image.url ? (
                  <img src={image.url} alt={image.caption || 'Galeri pernikahan'} />
                ) : (
                  <div className="gallery-placeholder">Foto segera hadir</div>
                )}
                <figcaption>{image.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="invitation-section">
        <div className="invitation-grid two-columns">
          <article className="invitation-surface">
            <p className="invitation-eyebrow">Dress Code</p>
            <h2>{wedding.dressCodeTitle}</h2>
            <p>{wedding.dressCodeDescription}</p>
            <div className="palette-row">
              {wedding.dressPalette.map((color) => (
                <span key={color} className="palette-chip" style={{ backgroundColor: color }} />
              ))}
            </div>
          </article>

          <article className="invitation-surface">
            <p className="invitation-eyebrow">Lokasi</p>
            <h2>{wedding.venueName || invitation.tempatPernikahan || 'Lokasi Acara'}</h2>
            <p>{wedding.venueAddress || invitation.tempatPernikahan || '-'}</p>
            {(invitation.linkGoogle || wedding.venueMapUrl) && (
              <a
                className="invitation-map-link"
                href={invitation.linkGoogle || wedding.venueMapUrl}
                target="_blank"
                rel="noreferrer"
              >
                Buka Google Maps
              </a>
            )}
          </article>
        </div>
      </section>

      {wedding.gifts.length > 0 && (
        <section className="invitation-section">
          <div className="invitation-section-heading">
            <p className="invitation-eyebrow">Gift Registry</p>
            <h2>Kirim Hadiah</h2>
            <p>{wedding.giftIntro}</p>
          </div>
          <div className="invitation-grid two-columns">
            {wedding.gifts.map((gift) => (
              <article key={gift.id} className="invitation-surface">
                <h3>{gift.label}</h3>
                <p>{gift.bankName}</p>
                <strong>{gift.accountNumber}</strong>
                <p>{gift.accountName}</p>
                {gift.qrImageUrl && <img className="gift-qr" src={gift.qrImageUrl} alt={`QR ${gift.label}`} />}
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="invitation-section">
        <div className="invitation-section-heading">
          <p className="invitation-eyebrow">RSVP</p>
          <h2>Konfirmasi Kehadiran</h2>
        </div>
        <div className="invitation-card invitation-card-wide">
          <form className="invitation-form" onSubmit={handleSubmit}>
            <label>
              Kehadiran
              <select
                value={form.response}
                onChange={(event) => setForm((current) => ({ ...current, response: event.target.value }))}
              >
                <option value="confirmed">Hadir</option>
                <option value="declined">Tidak bisa hadir</option>
              </select>
            </label>

            <label>
              Jumlah Orang
              <input
                type="number"
                min="1"
                value={form.jumlahOrang}
                onChange={(event) => setForm((current) => ({ ...current, jumlahOrang: event.target.value }))}
              />
            </label>

            <label>
              Preferensi Menu
              <input
                value={form.menu}
                onChange={(event) => setForm((current) => ({ ...current, menu: event.target.value }))}
                placeholder="Opsional"
              />
            </label>

            <label>
              Catatan
              <textarea
                value={form.catatan}
                onChange={(event) => setForm((current) => ({ ...current, catatan: event.target.value }))}
                placeholder="Sampaikan pesan atau kebutuhan khusus"
              />
            </label>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Mengirim RSVP...' : 'Kirim RSVP'}
            </button>
          </form>

          {status.message && <div className={`invitation-status ${status.type}`}>{status.message}</div>}
        </div>
      </section>

      {wedding.notes.length > 0 && (
        <section className="invitation-section invitation-notes">
          <div className="invitation-section-heading">
            <p className="invitation-eyebrow">Info Tambahan</p>
            <h2>Catatan untuk Tamu</h2>
          </div>
          <ul>
            {wedding.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default InvitationPage;
