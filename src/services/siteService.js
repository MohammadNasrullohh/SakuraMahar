import { requestJson } from './apiClient';

export const fetchSiteContent = () => requestJson('/api/site-content');

export const updateSiteContent = (content) =>
  requestJson('/api/site-content', {
    method: 'PUT',
    auth: true,
    body: content
  });

export const sendContactMessage = (payload) =>
  requestJson('/api/contact/send', {
    method: 'POST',
    body: payload
  });

export const createOrder = (payload) =>
  requestJson('/api/orders', {
    method: 'POST',
    auth: 'optional',
    body: payload
  });

export const fetchAdminDashboard = () =>
  requestJson('/api/admin/dashboard', {
    auth: true
  });

export const fetchAdminUsers = () =>
  requestJson('/api/admin/users', {
    auth: true
  });

export const updateAdminUser = (id, payload) =>
  requestJson(`/api/admin/users/${id}`, {
    method: 'PATCH',
    auth: true,
    body: payload
  });

export const deleteAdminUser = (id) =>
  requestJson(`/api/admin/users/${id}`, {
    method: 'DELETE',
    auth: true
  });

export const fetchMahars = () =>
  requestJson('/api/mahar', {
    auth: true
  });

export const createMahar = (payload) =>
  requestJson('/api/mahar/create', {
    method: 'POST',
    auth: true,
    body: payload
  });

export const updateMahar = (id, payload) =>
  requestJson(`/api/mahar/${id}`, {
    method: 'PATCH',
    auth: true,
    body: payload
  });

export const deleteMahar = (id) =>
  requestJson(`/api/mahar/${id}`, {
    method: 'DELETE',
    auth: true
  });

export const addMaharPayment = (id, payload) =>
  requestJson(`/api/mahar/${id}/bayar`, {
    method: 'POST',
    auth: true,
    body: payload
  });

export const fetchGuests = () =>
  requestJson('/api/guests/list', {
    auth: true
  });

export const createGuest = (payload) =>
  requestJson('/api/guests/add', {
    method: 'POST',
    auth: true,
    body: payload
  });

export const updateGuest = (id, payload) =>
  requestJson(`/api/guests/${id}`, {
    method: 'PATCH',
    auth: true,
    body: payload
  });

export const deleteGuest = (id) =>
  requestJson(`/api/guests/${id}`, {
    method: 'DELETE',
    auth: true
  });

export const fetchInvitations = () =>
  requestJson('/api/undangan/list', {
    auth: true
  });

export const createInvitation = (payload) =>
  requestJson('/api/undangan/send', {
    method: 'POST',
    auth: true,
    body: payload
  });

export const updateInvitation = (id, payload) =>
  requestJson(`/api/undangan/${id}`, {
    method: 'PATCH',
    auth: true,
    body: payload
  });

export const deleteInvitation = (id) =>
  requestJson(`/api/undangan/${id}`, {
    method: 'DELETE',
    auth: true
  });

export const fetchInvitationByCode = (code) => requestJson(`/api/undangan/${code}`);

export const submitInvitationResponse = (code, payload) =>
  requestJson(`/api/undangan/rsvp/${code}`, {
    method: 'POST',
    body: payload
  });

export const fetchMessages = () =>
  requestJson('/api/contact', {
    auth: true
  });

export const fetchOrders = () =>
  requestJson('/api/orders', {
    auth: true
  });

export const updateOrder = (id, payload) =>
  requestJson(`/api/orders/${id}`, {
    method: 'PATCH',
    auth: true,
    body: payload
  });

export const deleteOrder = (id) =>
  requestJson(`/api/orders/${id}`, {
    method: 'DELETE',
    auth: true
  });

export const fetchAuditLogs = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return requestJson(`/api/admin/audit-logs${query ? `?${query}` : ''}`, {
    auth: true
  });
};

export const fetchMediaAssets = () =>
  requestJson('/api/media', {
    auth: true
  });

export const uploadMediaAsset = (file, folder = 'general') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  return requestJson('/api/media/upload', {
    method: 'POST',
    auth: true,
    body: formData
  });
};

export const updateMediaAsset = (id, payload) =>
  requestJson(`/api/media/${id}`, {
    method: 'PATCH',
    auth: true,
    body: payload
  });

export const deleteMediaAsset = (id) =>
  requestJson(`/api/media/${id}`, {
    method: 'DELETE',
    auth: true
  });

export const respondToMessage = (id, response) =>
  requestJson(`/api/contact/${id}/respond`, {
    method: 'POST',
    auth: true,
    body: { response }
  });

export const deleteMessage = (id) =>
  requestJson(`/api/contact/${id}`, {
    method: 'DELETE',
    auth: true
  });
