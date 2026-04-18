# 🌸 Sakura Mahar Backend

Backend API yang lengkap dan production-ready untuk platform pernikahan modern Sakura Mahar.

## ✨ Fitur

- ✅ User Authentication dengan JWT
- ✅ Password Hashing dengan bcryptjs
- ✅ Mahar Management (Digital Payment)
- ✅ Guest List Management
- ✅ Digital Invitation dengan RSVP
- ✅ Contact Message System
- ✅ Input Validation
- ✅ Error Handling
- ✅ CORS Support
- ✅ Environment Configuration

## 🚀 Quick Start

### Prerequisites
- Node.js v14 atau lebih tinggi
- npm atau yarn

### Installation

1. **Clone/Download Repository**
```bash
cd backend
```

2. **Install Dependencies**
```bash
npm install
```

3. **Setup Environment Variables**
Buat file `.env` di folder backend:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_in_production
MONGODB_URI=mongodb://localhost:27017/sakura-mahar
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

4. **Run Server**

Development mode (dengan auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server akan berjalan di: `http://localhost:5000`

## 📁 Project Structure

```
backend/
│
├── server.js                    # Main server entry point
├── package.json                 # Dependencies & scripts
├── .env                        # Environment variables (local)
├── .env.example                # Environment template
│
├── routes/                     # API Routes
│   ├── auth.js                # Authentication & Authorization
│   ├── users.js               # User Management
│   ├── mahar.js               # Mahar Management
│   ├── guests.js              # Guest List Management
│   ├── undangan.js            # Invitation System
│   └── contact.js             # Contact Messages
│
├── API_DOCUMENTATION.md        # Lengkap API docs
└── sakura_mahar_postman.json  # Postman collection

```

## 🔌 API Endpoints Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user baru |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/verify` | Verify JWT token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get user profile (auth required) |
| PUT | `/api/users/profile` | Update profile (auth required) |
| GET | `/api/users` | Get all users (admin) |

### Mahar (Digital Payment)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mahar/create` | Create new mahar |
| GET | `/api/mahar` | Get all mahars |
| GET | `/api/mahar/{id}` | Get mahar details |
| POST | `/api/mahar/{id}/bayar` | Record payment |

### Guests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/guests/add` | Add new guest |
| GET | `/api/guests/list` | Get guest list |
| PUT | `/api/guests/{id}/status` | Update guest status |
| DELETE | `/api/guests/{id}` | Delete guest |

### Undangan (Invitations)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/undangan/send` | Send invitation |
| GET | `/api/undangan/list` | Get all invitations |
| GET | `/api/undangan/{code}` | Get invitation details |
| POST | `/api/undangan/rsvp/{code}` | Submit RSVP response |

### Contact
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact/send` | Send contact message |
| GET | `/api/contact` | Get all messages (admin) |
| GET | `/api/contact/{id}` | Get message details |
| POST | `/api/contact/{id}/respond` | Send response |

## 🧪 Testing API

### Menggunakan Postman

1. **Import Collection**
   - Buka Postman
   - Click `Import`
   - Select `sakura_mahar_postman.json`

2. **Set Environment Variable**
   - Create environment baru
   - Add variable: `token` = token dari login response

3. **Test Endpoints**
   - Register user terlebih dahulu
   - Login untuk mendapatkan token
   - Gunakan token untuk endpoint yang memerlukan autentikasi

### Menggunakan cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nama": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Get Profile (ganti TOKEN dengan token dari login)
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer TOKEN"
```

### Menggunakan Fetch (JavaScript)

```javascript
// Register
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nama: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    confirmPassword: 'password123'
  })
});

const data = await response.json();
console.log(data);

// Login
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.token;

// Get Profile
const profileResponse = await fetch('http://localhost:5000/api/users/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const profile = await profileResponse.json();
console.log(profile);
```

## 🔐 Authentication Flow

```
1. User Register
   ↓
2. User Login
   ↓
3. Server return JWT Token
   ↓
4. Client store Token
   ↓
5. Client send Token in Header (Authorization: Bearer {token})
   ↓
6. Server verify Token
   ↓
7. Grant access to protected routes
```

## 📋 Data Validation

### Register Validation
- Nama: Required
- Email: Required, valid email format
- Password: Required, min 6 characters
- Confirm Password: Must match password
- No Telepon: Optional

### Mahar Validation
- Jumlah: Required, must be number
- Metode Perayaan: Required

### Guest Validation
- Nama: Required
- Email: Required, valid email format

### Contact Validation
- Nama: Required
- Email: Required, valid email format
- Pesan: Required, min 10 characters

## 🛡️ Security Best Practices

1. **JWT Token**
   - Token expires dalam 7 hari
   - Disimpan di local storage (frontend)
   - Dikirim di Authorization header

2. **Password Security**
   - Hashed dengan bcryptjs (10 rounds)
   - Never stored plain text
   - Min 6 characters

3. **CORS Configuration**
   - Allow specific origins
   - Prevent unauthorized requests

4. **Environment Variables**
   - Sensitive data di .env
   - Never commit .env ke git
   - Use .env.example untuk template

5. **Input Validation**
   - Validate semua input
   - Sanitize data
   - Reject invalid requests

## 📊 Response Format

### Success Response
```json
{
  "message": "Operation berhasil",
  "data": { ... },
  "token": "..." // jika applicable
}
```

### Error Response
```json
{
  "error": "Deskripsi error",
  "status": 400
}
```

## 🚀 Production Deployment

### Heroku
```bash
# Login ke Heroku
heroku login

# Create app
heroku create sakura-mahar-api

# Set environment variables
heroku config:set JWT_SECRET=your_production_secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### AWS/DigitalOcean
1. Setup server dengan Node.js
2. Install PM2 untuk process management
3. Setup Nginx sebagai reverse proxy
4. Configure SSL/TLS
5. Setup CI/CD pipeline

### Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

## 📈 Monitoring & Logging

### Debug Mode
Set `NODE_ENV=development` untuk verbose logging

### Error Logging
Semua error ter-log di console dan dapat di-redirect ke file

### API Health Check
```bash
curl http://localhost:5000/api/health
```

## 🐛 Troubleshooting

### "Cannot find module 'express'"
```bash
npm install
```

### "JWT verification failed"
- Check token valid
- Check JWT_SECRET sama di server & client
- Check token belum expired

### "CORS error"
- Check FRONTEND_URL di .env
- Update CORS configuration di server.js jika perlu

### "Port already in use"
```bash
# Ubah port di .env atau
lsof -i :5000  # Find process
kill -9 {PID}  # Kill process
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [Postman Documentation](https://learning.postman.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 📞 Support & Contributing

Untuk masalah atau saran, hubungi: info@sakuramahar.com

## 📄 License

© 2026 Sakura Mahar. All rights reserved.

---

**Happy Coding!** 🌸
