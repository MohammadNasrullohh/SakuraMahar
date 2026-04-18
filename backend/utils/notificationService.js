const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });

  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const activeTransporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@sakuramahar.local';

  if (!activeTransporter) {
    return {
      delivered: false,
      channel: 'email',
      reason: 'SMTP belum dikonfigurasi.'
    };
  }

  await activeTransporter.sendMail({
    from,
    to,
    subject,
    html,
    text
  });

  return {
    delivered: true,
    channel: 'email'
  };
};

const sendWhatsApp = async ({ to, message }) => {
  const endpoint = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_API_TOKEN;

  if (!endpoint || !token || !to) {
    return {
      delivered: false,
      channel: 'whatsapp',
      reason: 'WhatsApp API belum dikonfigurasi.'
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      to,
      message
    })
  });

  if (!response.ok) {
    const rawBody = await response.text();
    throw new Error(rawBody || 'Gagal mengirim notifikasi WhatsApp.');
  }

  return {
    delivered: true,
    channel: 'whatsapp'
  };
};

const notifyPasswordReset = async ({ user, resetUrl }) => {
  const results = [];

  if (user.email) {
    results.push(
      await sendEmail({
        to: user.email,
        subject: 'Reset Password Sakura Mahar',
        text: `Gunakan link berikut untuk mengatur ulang password Anda: ${resetUrl}`,
        html: `<p>Gunakan link berikut untuk mengatur ulang password Anda:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
      })
    );
  }

  if (user.noTelepon) {
    results.push(
      await sendWhatsApp({
        to: user.noTelepon,
        message: `Reset password Sakura Mahar: ${resetUrl}`
      })
    );
  }

  return results;
};

const notifyInvitationShare = async ({ invitation, shareLink }) => {
  const results = [];
  const textMessage = `Halo ${invitation.guestNama}, ini link undangan Anda: ${shareLink}`;

  if (invitation.guestEmail) {
    results.push(
      await sendEmail({
        to: invitation.guestEmail,
        subject: 'Undangan Pernikahan Sakura Mahar',
        text: textMessage,
        html: `<p>${textMessage}</p><p><a href="${shareLink}">${shareLink}</a></p>`
      })
    );
  }

  return results;
};

const notifyMessageResponse = async ({ message, response }) => {
  if (!message.email) {
    return [];
  }

  const textBody = `Halo ${message.nama}, berikut balasan dari Sakura Mahar:\n\n${response}`;
  return [
    await sendEmail({
      to: message.email,
      subject: `Balasan untuk: ${message.subjek || 'Pesan Anda'}`,
      text: textBody,
      html: `<p>Halo ${message.nama},</p><p>${response}</p>`
    })
  ];
};

module.exports = {
  notifyInvitationShare,
  notifyMessageResponse,
  notifyPasswordReset,
  sendEmail,
  sendWhatsApp
};
