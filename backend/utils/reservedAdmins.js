const RESERVED_ADMIN_EMAILS = ['srullasrul59@gmail.com'];

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const isReservedAdminEmail = (email = '') =>
  RESERVED_ADMIN_EMAILS.includes(normalizeEmail(email));

module.exports = {
  RESERVED_ADMIN_EMAILS,
  isReservedAdminEmail,
  normalizeEmail
};
