import { requestJson } from './apiClient';

const AUTH_TOKEN_KEY = 'sakuraMaharToken';
const AUTH_USER_KEY = 'sakuraMaharUser';
const normalizeEmail = (email = '') => email.trim().toLowerCase();

export const saveAuthSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const getStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const getStoredUser = () => {
  const rawUser = localStorage.getItem(AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    clearAuthSession();
    return null;
  }
};

const buildAuthPayload = (type, formData) => {
  const normalizedEmail = normalizeEmail(formData.email);

  if (type === 'login') {
    return {
      email: normalizedEmail,
      password: formData.password
    };
  }

  return {
    nama: formData.nama.trim(),
    email: normalizedEmail,
    password: formData.password,
    confirmPassword: formData.confirmPassword,
    noTelepon: formData.noTelepon.trim()
  };
};

export const submitAuthForm = async (type, formData) => {
  const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/register';
  const data = await requestJson(endpoint, {
    method: 'POST',
    body: buildAuthPayload(type, formData)
  });

  saveAuthSession({
    token: data.token,
    user: data.user
  });

  return data;
};

export const requestPasswordReset = async (email) => {
  return requestJson('/api/auth/forgot-password', {
    method: 'POST',
    body: {
      email: normalizeEmail(email)
    }
  });
};

export const resetPassword = async ({ token, password, confirmPassword }) => {
  return requestJson('/api/auth/reset-password', {
    method: 'POST',
    body: {
      token,
      password,
      confirmPassword
    }
  });
};

export const changePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
  const token = getStoredToken();

  if (!token) {
    throw new Error('Sesi login tidak ditemukan. Silakan login ulang.');
  }

  const data = await requestJson('/api/auth/change-password', {
    method: 'POST',
    auth: true,
    body: {
      currentPassword,
      newPassword,
      confirmPassword
    }
  });

  saveAuthSession({
    token: data.token || token,
    user: data.user
  });

  return data;
};

export const verifyStoredSession = async () => {
  const token = getStoredToken();

  if (!token) {
    clearAuthSession();
    return null;
  }

  try {
    const data = await requestJson('/api/auth/verify', {
      method: 'POST',
      auth: true,
      body: { token }
    });

    saveAuthSession({
      token: data.token || token,
      user: data.user
    });

    return data.user || null;
  } catch (error) {
    clearAuthSession();
    throw error;
  }
};
