# Sakura Mahar Backend API

Backend API lengkap untuk platform pernikahan modern Sakura Mahar.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Konfigurasi Environment
Edit file `.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
MONGODB_URI=mongodb://localhost:27017/sakura-mahar
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### 3. Jalankan Server
```bash
npm start
# atau untuk development dengan auto-reload
npm run dev
```

Server akan berjalan di `http://localhost:5000`

## 📡 API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "nama": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "noTelepon": "081234567890"
}
```

Response:
```json
{
  "message": "Registrasi berhasil",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "nama": "John Doe",
    "email": "john@example.com",
    "noTelepon": "081234567890"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Users

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer {token}
```

#### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "nama": "John Doe",
  "noTelepon": "081234567890",
  "alamat": "Jl. Contoh No. 123",
  "kota": "Jakarta",
  "provinsi": "DKI Jakarta"
}
```

### Mahar

#### Create Mahar
```http
POST /api/mahar/create
Content-Type: application/json

{
  "userId": 1,
  "jumlah": 50000000,
  "deskripsi": "Mahar untuk pernikahan",
  "metodePerayaan": "transfer_bank",
  "tanggalPerayaan": "2026-05-01",
  "nama": "John Doe",
  "email": "john@example.com"
}
```

#### Get Mahar Details
```http
GET /api/mahar/{id}
```

#### Record Pembayaran Mahar
```http
POST /api/mahar/{id}/bayar
Content-Type: application/json

{
  "jumlah": 10000000,
  "metode": "transfer_bank",
  "bukti": "https://example.com/bukti.jpg"
}
```

### Guests

#### Add Guest
```http
POST /api/guests/add
Content-Type: application/json

{
  "userId": 1,
  "nama": "Guest Name",
  "email": "guest@example.com",
  "noTelepon": "081234567890",
  "status": "pending"
}
```

#### Get Guest List
```http
GET /api/guests/list
```

#### Update Guest Status
```http
PUT /api/guests/{id}/status
Content-Type: application/json

{
  "status": "confirmed",
  "kehadiran": true,
  "jumlahOrang": 2,
  "menu": "Makanan Halal",
  "catatan": "Ada alergi kacang"
}
```

#### Delete Guest
```http
DELETE /api/guests/{id}
```

### Undangan

#### Send Invitation
```http
POST /api/undangan/send
Content-Type: application/json

{
  "userId": 1,
  "guestId": 1,
  "guestEmail": "guest@example.com",
  "guestNama": "Guest Name",
  "tanggalPernikahan": "2026-05-15",
  "tempatPernikahan": "Grand Ballroom Hotel XYZ",
  "jamMulai": "09:00",
  "linkGoogle": "https://calendar.google.com/..."
}
```

Response:
```json
{
  "message": "Undangan berhasil dikirim",
  "undangan": { ... },
  "shareLink": "http://localhost:3000/rsvp/abc123def"
}
```

#### Get Invitation List
```http
GET /api/undangan/list
```

#### RSVP Response
```http
POST /api/undangan/rsvp/{uniqueCode}
Content-Type: application/json

{
  "response": "confirmed",
  "jumlahOrang": 2,
  "menu": "Makanan Halal",
  "catatan": "Tidak ada catatan"
}
```

Valid response: `confirmed` atau `declined`

### Contact

#### Send Message
```http
POST /api/contact/send
Content-Type: application/json

{
  "nama": "John Doe",
  "email": "john@example.com",
  "noTelepon": "081234567890",
  "subjek": "Pertanyaan tentang Paket Premium",
  "pesan": "Saya ingin tahu lebih lanjut tentang fitur-fitur paket premium..."
}
```

#### Get All Messages (Admin)
```http
GET /api/contact
```

#### Get Message Details
```http
GET /api/contact/{id}
```

#### Send Response to Message
```http
POST /api/contact/{id}/respond
Content-Type: application/json

{
  "response": "Terima kasih atas pertanyaan Anda. Kami akan segera menghubungi Anda..."
}
```

## 🔐 Authentication

Semua endpoint yang memerlukan autentikasi harus mengirimkan token di header:

```http
Authorization: Bearer {token}
```

Token dapat diperoleh dari endpoint login atau register.

## 📝 Error Responses

### Validation Error (400)
```json
{
  "error": "Email tidak valid"
}
```

### Unauthorized (401)
```json
{
  "error": "Token tidak valid"
}
```

### Not Found (404)
```json
{
  "error": "Mahar tidak ditemukan"
}
```

### Server Error (500)
```json
{
  "error": "Internal Server Error"
}
```

## 📦 Dependencies

- **express** - Web framework
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Environment variables
- **mongoose** - MongoDB ODM (opsional untuk production)
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **validator** - Data validation
- **multer** - File upload handling

## 🗂️ Project Structure

```
backend/
├── server.js           - Main server file
├── package.json        - Dependencies
├── .env               - Environment variables
└── routes/
    ├── auth.js        - Authentication routes
    ├── users.js       - User management
    ├── mahar.js       - Mahar management
    ├── guests.js      - Guest list management
    ├── undangan.js    - Invitation management
    └── contact.js     - Contact messages
```

## 🔄 Data Flow

1. **Registration** → User dibuat dengan password ter-hash
2. **Login** → Token JWT dihasilkan
3. **Protected Routes** → Token diverifikasi sebelum akses
4. **Mahar Creation** → User membuat mahar untuk pernikahan
5. **Guest Management** → Tamu ditambahkan ke daftar
6. **Invitation** → Undangan dikirim dengan unique code
7. **RSVP** → Tamu merespons melalui link unik
8. **Contact** → Pesan dari pengunjung tersimpan

## 📊 Statistik & Analytics

Endpoint list menyediakan statistik real-time:

```json
{
  "statistik": {
    "total": 100,
    "confirmed": 85,
    "declined": 10,
    "pending": 5
  }
}
```

## 🚀 Deployment

### Production Environment
1. Set `NODE_ENV=production` di .env
2. Ubah `JWT_SECRET` ke kunci yang aman
3. Konfigurasi MongoDB untuk production
4. Deploy ke server (Heroku, AWS, DigitalOcean, dll)

### Contoh Deploy ke Heroku
```bash
git push heroku main
```

## 📞 Support

Untuk bantuan atau pertanyaan, hubungi: info@sakuramahar.com

## 📄 License

© 2026 Sakura Mahar. All rights reserved.
