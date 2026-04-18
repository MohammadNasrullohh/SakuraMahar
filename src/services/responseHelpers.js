const getBackendUnavailableMessage = (response, rawBody) => {
  const contentType = response.headers.get('content-type') || '';
  const normalizedBody = String(rawBody || '').trim().toLowerCase();
  const looksLikeHtml =
    contentType.includes('text/html') ||
    normalizedBody.startsWith('<!doctype html') ||
    normalizedBody.startsWith('<html');

  if (looksLikeHtml || response.status === 404 || response.status >= 500) {
    return 'Backend publik belum aktif, jadi login dan fitur admin belum bisa dipakai saat ini.';
  }

  return 'Response server tidak valid.';
};

export const readJsonApiResponse = async (response) => {
  const rawBody = await response.text();

  if (!rawBody) {
    if (!response.ok) {
      throw new Error('Terjadi kesalahan pada server.');
    }

    return {};
  }

  try {
    const data = JSON.parse(rawBody);

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Terjadi kesalahan pada server.');
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(getBackendUnavailableMessage(response, rawBody));
    }

    throw error;
  }
};
