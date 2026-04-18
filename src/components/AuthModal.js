import React, { useEffect, useMemo, useState } from 'react';
import './AuthModal.css';
import {
  changePassword,
  requestPasswordReset,
  submitAuthForm
} from '../services/authService';

const AuthModal = ({
  type,
  onClose,
  onLoginSuccess,
  onOpenModal,
  brandName = 'Sakura Mahar',
  contextMessage = ''
}) => {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    confirmPassword: '',
    noTelepon: '',
    currentPassword: '',
    newPassword: ''
  });
  const [status, setStatus] = useState({ message: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSecret, setShowSecret] = useState({
    password: false,
    confirmPassword: false,
    currentPassword: false,
    newPassword: false
  });

  const contentMap = useMemo(
    () => ({
      login: {
        eyebrow: 'Akses akun Anda',
        title: `Masuk ke ${brandName}`,
        subtitle: 'Lanjutkan pesanan, pantau checkout, dan kelola akun Anda tanpa repot.',
        badge: 'Sesi aman',
        highlights: [
          'Akses detail pesanan dan riwayat akun dalam satu tempat.',
          'Proses checkout jadi lebih cepat karena data pelanggan tersimpan.',
          'Bisa lanjut ke panel admin jika akun memiliki akses khusus.'
        ]
      },
      register: {
        eyebrow: 'Mulai lebih cepat',
        title: `Daftar ${brandName}`,
        subtitle: 'Buat akun baru untuk mempercepat pemesanan, konsultasi, dan proses follow-up.',
        badge: 'Daftar < 1 menit',
        highlights: [
          'Simpan identitas pelanggan agar order berikutnya lebih praktis.',
          'Langsung lanjut checkout tanpa mengulang isi data dasar.',
          'Notifikasi dan reset password lebih mudah dikelola lewat email.'
        ]
      },
      forgot: {
        eyebrow: 'Pulihkan akses',
        title: 'Lupa Password',
        subtitle: 'Masukkan email aktif. Kami akan kirim link reset untuk membuat password baru.',
        badge: 'Reset aman',
        highlights: [
          'Link reset dikirim ke email yang terdaftar.',
          'Password lama tidak akan ditampilkan kembali demi keamanan akun.',
          'Setelah reset berhasil, Anda bisa login kembali seperti biasa.'
        ]
      },
      changePassword: {
        eyebrow: 'Perbarui keamanan',
        title: 'Ubah Password',
        subtitle: 'Gunakan password baru yang kuat agar akun tetap aman dan mudah Anda kelola.',
        badge: 'Keamanan akun',
        highlights: [
          'Password baru akan langsung aktif untuk sesi berikutnya.',
          'Gunakan kombinasi huruf dan angka agar lebih aman.',
          'Pastikan password baru berbeda dari password sebelumnya.'
        ]
      }
    }),
    [brandName]
  );

  const content = contentMap[type] || contentMap.login;
  const passwordValue =
    type === 'changePassword' ? formData.newPassword : formData.password;

  const passwordChecks = useMemo(
    () => ({
      minLength: passwordValue.length >= 6,
      hasLetter: /[a-zA-Z]/.test(passwordValue),
      hasNumber: /\d/.test(passwordValue)
    }),
    [passwordValue]
  );

  const handleDismiss = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  useEffect(() => {
    setFormData({
      nama: '',
      email: '',
      password: '',
      confirmPassword: '',
      noTelepon: '',
      currentPassword: '',
      newPassword: ''
    });
    setStatus({ message: '', type: '' });
    setIsSubmitting(false);
    setFieldErrors({});
    setShowSecret({
      password: false,
      confirmPassword: false,
      currentPassword: false,
      newPassword: false
    });
  }, [type]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isSubmitting, onClose]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      if (!prev[name] && !prev.confirmPassword && !prev.password && !prev.newPassword) {
        return prev;
      }

      const next = { ...prev };
      delete next[name];

      if (name === 'password' || name === 'newPassword' || name === 'confirmPassword') {
        delete next.confirmPassword;
        delete next.password;
        delete next.newPassword;
      }

      if (name === 'email') {
        delete next.email;
      }

      return next;
    });
  };

  const toggleSecretVisibility = (name) => {
    setShowSecret((current) => ({
      ...current,
      [name]: !current[name]
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const email = formData.email.trim().toLowerCase();

    if (type === 'register' && !formData.nama.trim()) {
      nextErrors.nama = 'Nama lengkap wajib diisi.';
    }

    if ((type === 'login' || type === 'register' || type === 'forgot') && !email) {
      nextErrors.email = 'Email wajib diisi.';
    }

    if (
      (type === 'login' || type === 'register' || type === 'forgot') &&
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      nextErrors.email = 'Format email belum valid.';
    }

    if (type === 'login' && !formData.password) {
      nextErrors.password = 'Password wajib diisi.';
    }

    if (type === 'register') {
      if (!formData.password) {
        nextErrors.password = 'Password wajib diisi.';
      } else if (formData.password.length < 6) {
        nextErrors.password = 'Password minimal 6 karakter.';
      }

      if (!formData.confirmPassword) {
        nextErrors.confirmPassword = 'Konfirmasi password wajib diisi.';
      } else if (formData.password !== formData.confirmPassword) {
        nextErrors.confirmPassword = 'Konfirmasi password tidak cocok.';
      }
    }

    if (type === 'changePassword') {
      if (!formData.currentPassword) {
        nextErrors.currentPassword = 'Password saat ini wajib diisi.';
      }

      if (!formData.newPassword) {
        nextErrors.newPassword = 'Password baru wajib diisi.';
      } else if (formData.newPassword.length < 6) {
        nextErrors.newPassword = 'Password baru minimal 6 karakter.';
      }

      if (!formData.confirmPassword) {
        nextErrors.confirmPassword = 'Konfirmasi password baru wajib diisi.';
      } else if (formData.newPassword !== formData.confirmPassword) {
        nextErrors.confirmPassword = 'Konfirmasi password baru tidak cocok.';
      }
    }

    if (type === 'register' && formData.noTelepon.trim()) {
      const compactPhone = formData.noTelepon.replace(/[^\d+]/g, '');
      if (compactPhone.length < 9) {
        nextErrors.noTelepon = 'Nomor telepon terlihat terlalu pendek.';
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ message: '', type: '' });
    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setStatus({
        message: 'Periksa kembali data yang masih belum lengkap.',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let data;

      if (type === 'forgot') {
        data = await requestPasswordReset(formData.email);
      } else if (type === 'changePassword') {
        data = await changePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        });
      } else {
        data = await submitAuthForm(type, formData);
      }

      const successMessage =
        data.message ||
        (type === 'login' ? 'Login berhasil!' : type === 'register' ? 'Registrasi berhasil!' : 'Berhasil.');
      setStatus({ message: successMessage, type: 'success' });
      setFieldErrors({});

      if (onLoginSuccess && data.user) {
        onLoginSuccess(data.user);
      }

      window.setTimeout(() => {
        if (type === 'forgot') {
          onOpenModal?.('login');
          return;
        }

        handleDismiss();
      }, 1100);
    } catch (error) {
      setStatus({ message: error.message || 'Gagal menyambung ke server.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldError = (name) =>
    fieldErrors[name] ? <span className="auth-field-error">{fieldErrors[name]}</span> : null;

  const renderPasswordField = ({
    name,
    label,
    placeholder,
    autoComplete,
    value,
    required = true
  }) => (
    <label className={`auth-field ${fieldErrors[name] ? 'auth-field-invalid' : ''}`}>
      <span className="auth-label">{label}</span>
      <div className="auth-input-shell">
        <input
          type={showSecret[name] ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          minLength={6}
          autoComplete={autoComplete}
          required={required}
        />
        <button
          type="button"
          className="auth-visibility-toggle"
          onClick={() => toggleSecretVisibility(name)}
          aria-label={showSecret[name] ? 'Sembunyikan password' : 'Tampilkan password'}
        >
          {showSecret[name] ? 'Sembunyikan' : 'Lihat'}
        </button>
      </div>
      {renderFieldError(name)}
    </label>
  );

  return (
    <div className="auth-modal-overlay" onClick={handleDismiss}>
      <div
        className={`auth-modal auth-modal-${type}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="auth-modal-shell">
          <aside className="auth-modal-aside">
            <div className="auth-brand-badge">{brandName}</div>
            <p className="auth-eyebrow">{content.eyebrow}</p>
            <h2 id="auth-modal-title">{content.title}</h2>
            <p className="auth-copy">{content.subtitle}</p>
            <div className="auth-chip">{content.badge}</div>
            <ul className="auth-highlight-list">
              {content.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </aside>

          <div className="auth-modal-main">
            <button
              className="auth-close"
              onClick={handleDismiss}
              type="button"
              aria-label="Tutup dialog autentikasi"
            >
              &times;
            </button>

            {contextMessage && <p className="auth-context">{contextMessage}</p>}
            {status.message && (
              <div className={`auth-status ${status.type}`} role="status" aria-live="polite">
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
          {type === 'register' && (
            <label className={`auth-field ${fieldErrors.nama ? 'auth-field-invalid' : ''}`}>
              <span className="auth-label">Nama Lengkap</span>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                placeholder="Contoh: Nadya Permata"
                autoComplete="name"
                required
                autoFocus
              />
              {renderFieldError('nama')}
            </label>
          )}

          {(type === 'login' || type === 'register' || type === 'forgot') && (
            <label className={`auth-field ${fieldErrors.email ? 'auth-field-invalid' : ''}`}>
              <span className="auth-label">Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nama@email.com"
                autoComplete="email"
                required
                autoFocus={type !== 'register'}
              />
              {renderFieldError('email')}
            </label>
          )}

          {(type === 'login' || type === 'register') && (
            renderPasswordField({
              name: 'password',
              label: 'Password',
              value: formData.password,
              placeholder: type === 'login' ? 'Masukkan password Anda' : 'Minimal 6 karakter',
              autoComplete: type === 'login' ? 'current-password' : 'new-password'
            })
          )}

          {type === 'changePassword' && (
            <>
              {renderPasswordField({
                name: 'currentPassword',
                label: 'Password Saat Ini',
                value: formData.currentPassword,
                placeholder: 'Masukkan password saat ini',
                autoComplete: 'current-password'
              })}
              {renderPasswordField({
                name: 'newPassword',
                label: 'Password Baru',
                value: formData.newPassword,
                placeholder: 'Gunakan password baru',
                autoComplete: 'new-password'
              })}
            </>
          )}

          {(type === 'register' || type === 'changePassword') && (
            renderPasswordField({
              name: 'confirmPassword',
              label: type === 'register' ? 'Konfirmasi Password' : 'Konfirmasi Password Baru',
              value: formData.confirmPassword,
              placeholder: 'Ulangi password yang sama',
              autoComplete: 'new-password'
            })
          )}

          {type === 'register' && (
            <label className={`auth-field ${fieldErrors.noTelepon ? 'auth-field-invalid' : ''}`}>
              <span className="auth-label">No. Telepon</span>
              <input
                type="tel"
                name="noTelepon"
                value={formData.noTelepon}
                onChange={handleChange}
                placeholder="08xxxxxxxxxx"
                autoComplete="tel"
              />
              {renderFieldError('noTelepon')}
            </label>
          )}

          {(type === 'register' || type === 'changePassword') && (
            <div className="auth-password-checklist" aria-live="polite">
              <p>Password yang baik sebaiknya:</p>
              <div className="auth-password-rules">
                <span className={passwordChecks.minLength ? 'is-valid' : ''}>Minimal 6 karakter</span>
                <span className={passwordChecks.hasLetter ? 'is-valid' : ''}>Memiliki huruf</span>
                <span className={passwordChecks.hasNumber ? 'is-valid' : ''}>Memiliki angka</span>
              </div>
            </div>
          )}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Mengirim...'
              : type === 'login'
                ? 'Masuk'
                : type === 'register'
                  ? 'Daftar'
                  : type === 'forgot'
                    ? 'Kirim Link Reset'
                    : 'Simpan Password'}
          </button>

          {type === 'login' && (
            <div className="auth-switch-links">
              <button
                type="button"
                className="auth-link-button"
                onClick={() => onOpenModal?.('forgot')}
              >
                Lupa password?
              </button>
              <button
                type="button"
                className="auth-link-button"
                onClick={() => onOpenModal?.('register')}
              >
                Belum punya akun? Daftar
              </button>
            </div>
          )}

          {type === 'forgot' && (
            <button
              type="button"
              className="auth-link-button"
              onClick={() => onOpenModal?.('login')}
            >
              Kembali ke login
            </button>
          )}

          {type === 'register' && (
            <button
              type="button"
              className="auth-link-button"
              onClick={() => onOpenModal?.('login')}
            >
              Sudah punya akun? Login
            </button>
          )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
