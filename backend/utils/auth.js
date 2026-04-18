const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET || 'secret';

const signUserToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );

const verifyAuthToken = (token) => jwt.verify(token, getJwtSecret());

module.exports = {
  signUserToken,
  verifyAuthToken
};
