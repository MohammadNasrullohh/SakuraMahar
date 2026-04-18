import React, { useState } from 'react';
import './ResetPasswordPage.css';
import { resetPassword } from '../services/authService';

const ResetPasswordPage = ({ token, brandName = 'Sakura Mahar' }) => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    if (!token) {
      setStatus({ type: 'error', message: 'Token reset tidak ditemukan.' });
      return;
    }

    if (formData.password.length < 6) {
      setStatus({ type: 'error', message: 'Password minimal 6 karakter.' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Konfirmasi password tidak cocok.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword({
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      setStatus({
        type: 'success',
        message: response.message || 'Password berhasil diatur ulang.'
      });
      setFormData({
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Reset password gagal.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-shell">
      <div className="reset-card">
        <p className="reset-eyebrow">{brandName} Account Recovery</p>
        <h1>Atur Ulang Password</h1>
        <p className="reset-copy">
          Masukkan password baru Anda. Setelah berhasil, Anda bisa kembali login ke aplikasi.
        </p>

        <form className="reset-form" onSubmit={handleSubmit}>
          <label>
            Password Baru
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </label>

          <label>
            Konfirmasi Password Baru
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              minLength={6}
              required
            />
          </label>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>

        {status.message && <div className={`reset-status ${status.type}`}>{status.message}</div>}

        <a className="reset-home-link" href="/">
          Kembali ke beranda
        </a>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
