const dotenv = require('dotenv');
const path = require('path');
const app = require('./app');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🌸 Sakura Mahar API Server`);
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n📍 Endpoints tersedia:`);
  console.log(`  - GET  /api/health                 - Health check`);
  console.log(`  - POST /api/auth/register          - Register user`);
  console.log(`  - POST /api/auth/login             - Login user`);
  console.log(`  - GET  /api/users/profile          - Get user profile`);
  console.log(`  - POST /api/mahar/create           - Create mahar`);
  console.log(`  - GET  /api/mahar/:id              - Get mahar details`);
  console.log(`  - POST /api/guests/add             - Add guest`);
  console.log(`  - GET  /api/guests/list            - Get guest list`);
  console.log(`  - POST /api/undangan/send          - Send invitation`);
  console.log(`  - POST /api/contact/send           - Send contact message\n`);
});

module.exports = app;
