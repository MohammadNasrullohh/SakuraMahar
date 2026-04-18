# 🌸 Sakura Mahar - Complete Project Structure

Panduan lengkap struktur proyek Sakura Mahar dengan Frontend & Backend.

## 📁 Project Structure

```
sakura-mahar/
│
├── 📄 index.html                    # Frontend utama (HTML Standalone)
├── 📄 package.json                  # Frontend dependencies
├── 📄 README.md                     # Frontend README
│
├── frontend/                        # Frontend files
│   ├── APIService.js               # API service class untuk frontend
│   └── api-integration-example.html # Contoh integrasi API
│
└── backend/                         # Backend API Server
    ├── server.js                   # Main server entry point
    ├── package.json                # Backend dependencies
    ├── .env                        # Environment variables
    ├── README.md                   # Backend README
    ├── API_DOCUMENTATION.md        # API documentation
    ├── sakura_mahar_postman.json  # Postman collection
    │
    ├── routes/                     # API Routes
    │   ├── auth.js                # Authentication (Register, Login)
    │   ├── users.js               # User Management
    │   ├── mahar.js               # Mahar (Digital Payment)
    │   ├── guests.js              # Guest List Management
    │   ├── undangan.js            # Invitation System
    │   └── contact.js             # Contact Messages
    │
    └── utils/                      # Helper utilities
        ├── responses.js            # Response helpers
        └── validation.js           # Validation helpers
```

## 🚀 Setup & Running

### Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file (already provided)
# Configure PORT, JWT_SECRET, etc.

# Run development server
npm run dev

# Or production
npm start
```

Server akan berjalan di: **http://localhost:5000**

### Frontend Setup

Frontend adalah HTML standalone yang bisa langsung dibuka di browser:

```bash
# Buka file di browser
./index.html
```

Atau untuk development dengan live server:
```bash
# Menggunakan Live Server VSCode extension
# Atau
python -m http.server 8000
# Buka http://localhost:8000
```

## 📊 API Overview

### Authentication (Auth)
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login & dapatkan token
- `POST /api/auth/verify` - Verify JWT token

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users` - Get all users (admin)

### Mahar (Digital Payment)
- `POST /api/mahar/create` - Create new mahar
- `GET /api/mahar` - Get all mahars
- `GET /api/mahar/{id}` - Get mahar details
- `POST /api/mahar/{id}/bayar` - Record payment

### Guests
- `POST /api/guests/add` - Add new guest
- `GET /api/guests/list` - Get guest list
- `PUT /api/guests/{id}/status` - Update guest status
- `DELETE /api/guests/{id}` - Delete guest

### Invitations
- `POST /api/undangan/send` - Send invitation
- `GET /api/undangan/list` - Get all invitations
- `GET /api/undangan/{code}` - Get invitation details
- `POST /api/undangan/rsvp/{code}` - Submit RSVP

### Contact
- `POST /api/contact/send` - Send contact message
- `GET /api/contact` - Get all messages (admin)
- `GET /api/contact/{id}` - Get message details
- `POST /api/contact/{id}/respond` - Send response

## 🔐 Authentication Flow

```
1. User Register/Login
   ↓
2. Backend returns JWT Token
   ↓
3. Frontend stores token in localStorage
   ↓
4. Frontend sends token in Authorization header
   ↓
5. Backend verifies token & grants access
```

## 📱 Testing API

### Option 1: Postman
1. Import `backend/sakura_mahar_postman.json`
2. Test semua endpoints langsung

### Option 2: Frontend Integration Example
1. Buka `frontend/api-integration-example.html`
2. Test register, login, add guest, contact form
3. Lihat responses langsung di browser

### Option 3: cURL / Terminal
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nama":"John","email":"john@test.com","password":"pass123","confirmPassword":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass123"}'
```

## 📦 Tech Stack

### Frontend
- HTML5
- CSS3 (Responsive Design)
- JavaScript (Vanilla)
- Font Awesome Icons
- Fetch API

### Backend
- Node.js
- Express.js
- JWT Authentication
- bcryptjs (Password hashing)
- CORS

### Database (Future)
- MongoDB (optional)
- Can be integrated later

## 🔑 Key Features Implemented

✅ User Registration & Login
✅ JWT Authentication
✅ Password Hashing
✅ Mahar Management
✅ Guest List Management
✅ Invitation System with RSVP
✅ Contact Form
✅ Error Handling
✅ Input Validation
✅ Responsive Design
✅ API Documentation
✅ Postman Collection

## 🛠️ Development Tips

### Using APIService in Frontend

```javascript
// Import APIService
<script src="frontend/APIService.js"></script>

// Initialize
const api = new APIService('http://localhost:5000');

// Register
const user = await api.register({
  nama: 'John Doe',
  email: 'john@test.com',
  password: 'pass123',
  confirmPassword: 'pass123'
});

// Login
const login = await api.login('john@test.com', 'pass123');

// Get Profile
const profile = await api.getUserProfile();

// Add Guest
const guest = await api.addGuest({
  userId: 1,
  nama: 'Guest Name',
  email: 'guest@test.com'
});
```

### Environment Variables (.env)

```env
PORT=5000                           # Server port
NODE_ENV=development                # Environment
JWT_SECRET=your_secret_key          # JWT secret
MONGODB_URI=mongodb://localhost:27017/sakura-mahar
API_URL=http://localhost:5000       # API URL
FRONTEND_URL=http://localhost:3000  # Frontend URL
```

## 🚀 Production Deployment

### Frontend
- Build files (HTML, CSS, JS)
- Deploy ke: Netlify, Vercel, AWS S3, atau hosting lain
- Update API_URL ke production backend

### Backend
- Deploy ke: Heroku, AWS, DigitalOcean, Google Cloud
- Configure environment variables
- Setup CI/CD pipeline
- Monitor logs & performance

## 📚 Documentation

- **Backend README**: `backend/README.md`
- **API Documentation**: `backend/API_DOCUMENTATION.md`
- **Frontend Example**: `frontend/api-integration-example.html`
- **Postman Collection**: `backend/sakura_mahar_postman.json`

## 📞 Support

Issues atau questions? 
- Email: info@sakuramahar.com
- Check documentation files untuk detailed info

## 🔄 Next Steps

1. ✅ Setup backend: `npm install && npm run dev`
2. ✅ Open frontend: Buka `index.html` di browser
3. ✅ Test API: Gunakan integration example atau Postman
4. ✅ Integrate: Update frontend untuk connect ke backend
5. 🔄 Deploy: Deploy ke production

## 📄 License

© 2026 Sakura Mahar. All rights reserved.

---

Happy Building! 🌸
