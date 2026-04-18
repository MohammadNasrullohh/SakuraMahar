import { readJsonApiResponse } from './responseHelpers';

const AUTH_TOKEN_KEY = 'sakuraMaharToken';
const readStoredToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const requestJson = async (endpoint, options = {}) => {
  const {
    auth = false,
    body,
    headers = {},
    ...restOptions
  } = options;
  const finalHeaders = { ...headers };
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (body !== undefined && !isFormData) {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
  }

  if (auth === true) {
    const token = readStoredToken();
    if (!token) {
      throw new Error('Sesi login tidak ditemukan. Silakan login ulang.');
    }

    finalHeaders.Authorization = `Bearer ${token}`;
  } else if (auth === 'optional') {
    const token = readStoredToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(endpoint, {
    ...restOptions,
    headers: finalHeaders,
    body: body !== undefined && finalHeaders['Content-Type'] === 'application/json'
      ? JSON.stringify(body)
      : body
  });

  return readJsonApiResponse(response);
};
