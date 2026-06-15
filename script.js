// ====== FIREBASE SETUP ======
const firebaseConfig = {
  apiKey: "AIzaSyAx8IU9omQeAcY1S9vMcTTfBOoQgtWRJpQ",
  authDomain: "sakura-mahar-db.firebaseapp.com",
  projectId: "sakura-mahar-db",
  storageBucket: "sakura-mahar-db.firebasestorage.app",
  messagingSenderId: "432942356126",
  appId: "1:432942356126:web:155f55f70bb341dd4ecd8f"
};

let db = null;
if (typeof firebase !== "undefined") {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}

let allOrdersFirebase = [];
try {
  allOrdersFirebase = JSON.parse(localStorage.getItem("sakuraMaharOrders")) || [];
} catch(e) {}

function initFirebaseListeners() {
  if (!db) return;
  db.collection("store").doc("products").onSnapshot((doc) => {
    if (doc.exists) {
      products = doc.data().items || [];
      writeStorage("sakuraMaharProducts", products);
      render();
    }
  });

  db.collection("store").doc("profile").onSnapshot((doc) => {
    if (doc.exists) {
      writeStorage("sakuraMaharStoreProfile", doc.data());
      render();
    }
  });

  db.collection("orders").onSnapshot((snapshot) => {
    allOrdersFirebase = snapshot.docs.map((d) => d.data());
    allOrdersFirebase.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    writeStorage("sakuraMaharOrders", allOrdersFirebase);
    if (state.route === "admin" || state.route === "profile") {
      render();
    }
  });
}

if (db) initFirebaseListeners();
// ==========================

const defaultProducts = [
  {
    id: "frame-red",
    name: "Mahar Akrilik Pernikahan Frame 3D",
    subtitle: "Mahar pernikahan handmade dengan desain bunga floral premium.",
    price: 350000,
    image: "assets/product-red.png",
    category: "Semua Produk",
    model: "Model Bingkai Mahar",
    badge: "Favorit",
    rating: 4.9,
    size: "35 x 45 cm",
    color: "Merah maroon"
  },
  {
    id: "frame-pink",
    name: "Mahar Akrilik Pernikahan Frame 3D",
    subtitle: "Rangkaian pink soft dengan inisial pasangan dan detail bunga.",
    price: 350000,
    image: "assets/product-pink.png",
    category: "Semua Produk",
    model: "Model Bingkai Mahar",
    badge: "Custom",
    rating: 4.8,
    size: "35 x 45 cm",
    color: "Pink"
  },
  {
    id: "frame-white",
    name: "Mahar Akrilik Pernikahan Frame 3D",
    subtitle: "Konsep putih gold yang elegan untuk akad dan resepsi.",
    price: 350000,
    image: "assets/product-white.png",
    category: "Semua Produk",
    model: "Model Bingkai Mahar",
    badge: "Premium",
    rating: 4.9,
    size: "35 x 45 cm",
    color: "Putih gold"
  },
  {
    id: "packing-red",
    name: "Packing Mahar Premium",
    subtitle: "Packing aman berlapis untuk pengiriman luar kota.",
    price: 95000,
    image: "assets/product-red.png",
    category: "Packing",
    model: "Packing",
    badge: "Aman",
    rating: 4.7,
    size: "Sesuai produk",
    color: "Kardus tebal"
  },
  {
    id: "frame-classic",
    name: "Mahar Akrilik Klasik",
    subtitle: "Desain floral klasik dengan frame tebal dan nama pasangan.",
    price: 380000,
    image: "assets/product-pink.png",
    category: "Model Bingkai Mahar",
    model: "Model Bingkai Mahar",
    badge: "Baru",
    rating: 4.9,
    size: "40 x 50 cm",
    color: "Pink gold"
  },
  {
    id: "packing-gold",
    name: "Packing Hantaran Wedding",
    subtitle: "Tambahan packing hantaran rapi untuk serah terima keluarga.",
    price: 120000,
    image: "assets/product-white.png",
    category: "Packing",
    model: "Packing",
    badge: "Rapi",
    rating: 4.8,
    size: "Medium",
    color: "Putih"
  }
];

const PRODUCT_STORE_VERSION = "manual-empty-v1";
const ADMIN_IDENTIFIERS = ["srullasrul59", "exca", "mutiaraexca31@gmail.com"];
let products = initializeProducts();

const formatPrice = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);

const state = {
  route: "home",
  category: "Semua Produk",
  cart: [],
  selectedProductId: products[0]?.id || null,
  featuredIndex: 1,
  quantity: 1,
  pickupMethod: "COD",
  query: "",
  user: readStorage("sakuraMaharCurrentUser", null),
  orderData: readStorage("sakuraMaharOrderData", null),
  currentOrderId: readStorage("sakuraMaharCurrentOrderId", null),
  adminTab: "Produk",
  adminCategory: "Semua Produk",
  adminView: "list",
  editProductId: null,
  adminOrderTab: "Belum Dibayar",
  carouselDirection: 0
};

const app = document.querySelector("#app");
const cartCount = document.querySelector("#cartCount");
const navToggle = document.querySelector(".nav-toggle");
const searchInput = document.querySelector("#siteSearch");
const accountChip = document.querySelector(".account-chip");

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function slugify(value) {
  const slug = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `produk-${Date.now()}`;
}

function normalizeProduct(product) {
  if (!product || typeof product !== "object") return null;
  const name = String(product.name || "").trim();
  if (!name) return null;
  const category = String(product.category || product.model || "Model Bingkai Mahar").trim();
  const price = Number(product.price);
  const stock = Number(product.stock);

  return {
    id: String(product.id || `${slugify(name)}-${Date.now()}`).trim(),
    name,
    subtitle: String(product.subtitle || product.description || "Mahar handmade dengan desain elegan dan detail rapi.").trim(),
    price: Number.isFinite(price) && price > 0 ? price : 0,
    image: String(product.image || "assets/product-red.png").trim(),
    category: category || "Model Bingkai Mahar",
    model: String(product.model || category || "Model Bingkai Mahar").trim(),
    badge: String(product.badge || "Custom").trim(),
    rating: Number(product.rating) || 4.9,
    size: String(product.size || "Custom").trim(),
    color: String(product.color || "Custom").trim(),
    stock: Number.isFinite(stock) && stock >= 0 ? stock : 1,
    pickups: Array.isArray(product.pickups) && product.pickups.length ? product.pickups : ["COD", "Pick Up"],
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || product.createdAt || new Date().toISOString()
  };
}

function initializeProducts() {
  const version = readStorage("sakuraMaharProductStoreVersion", "");
  if (version !== PRODUCT_STORE_VERSION) {
    writeStorage("sakuraMaharProductStoreVersion", PRODUCT_STORE_VERSION);
    writeStorage("sakuraMaharProducts", []);
    return [];
  }

  const storedProducts = readStorage("sakuraMaharProducts", null);
  if (Array.isArray(storedProducts)) {
    return storedProducts.map(normalizeProduct).filter(Boolean);
  }

  writeStorage("sakuraMaharProducts", []);
  return [];
}

function saveProducts() {
  writeStorage("sakuraMaharProducts", products);
  if (db) {
    db.collection("store").doc("products").set({ items: products }, { merge: true });
  }
}

function truncateText(value, maxLength = 64) {
  const text = String(value || "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

function getOrders() {
  return allOrdersFirebase.length ? allOrdersFirebase : readStorage("sakuraMaharOrders", []);
}

function saveOrders(orders) {
  writeStorage("sakuraMaharOrders", orders);
  if (db) {
    orders.forEach(order => {
      db.collection("orders").doc(order.id).set(order, { merge: true });
    });
  }
}

function getStoreProfile() {
  const defaultProfile = {
    name: "Sakura Mahar",
    shortDesc: "Informasi Yang Ditampilkan Ke Pembeli",
    description: "Sakura Mahar merupakan usaha handmade kreatif yang fokus pada pembuatan mahar frame, gift frame, dan dekorasi spesial untuk berbagai momen berharga. Berdiri dengan semangat menghadirkan karya yang indah dan bermakna, Sakura Mahar menggabungkan kreativitas, seni, dan sentuhan personal dalam setiap produk yang dibuat.\\n\\nKami percaya bahwa setiap momen spesial layak dikenang dengan cara yang unik dan elegan. Oleh karena itu, setiap produk dirancang dengan detail, ketelitian, dan kombinasi dekorasi estetik agar mampu memberikan kesan istimewa bagi pelanggan.",
    vision: "Menjadi brand mahar handmade terpercaya yang dikenal dengan kualitas, kreativitas, dan pelayanan terbaik di Indonesia.",
    mission: "Menghadirkan produk handmade berkualitas tinggi\\nMemberikan desain yang unik, elegan, dan estetik\\nMengutamakan kepuasan pelanggan dalam setiap pesanan\\nMengembangkan kreativitas dan inovasi produk secara berkelanjutan\\nMemberikan pelayanan yang ramah, cepat, dan profesional",
    advantages: "Desain bisa custom sesuai keinginan\\nHandmade dengan detail rapi\\nMenggunakan material berkualitas\\nHarga terjangkau dan bersahabat\\nCocok untuk berbagai acara spesial\\nPelayanan cepat dan responsif\\nPackaging aman dan elegan",
    valueKreativitas: "Kami selalu menghadirkan desain baru yang modern dan menarik.",
    valueKualitas: "Setiap produk dibuat menggunakan material pilihan dan pengerjaan yang detail.",
    valueKepuasan: "Kepuasan pelanggan menjadi prioritas utama dalam setiap layanan kami.",
    valueKetepatan: "Kami berkomitmen memberikan hasil terbaik sesuai permintaan dan tepat waktu.",
    address: "Klirejo, Kebumen, Jawa Tengah",
    phone: "0859 3288 4293",
    instagram: "Sakura Mahar",
    shopee: "Sakura Mahar",
    hours: [
      { day: "Senin", open: "09.00", close: "16.00", isClosed: false },
      { day: "Selasa", open: "09.00", close: "16.00", isClosed: false },
      { day: "Rabu", open: "09.00", close: "16.00", isClosed: false },
      { day: "Kamis", open: "09.00", close: "16.00", isClosed: false },
      { day: "Jumat", open: "09.00", close: "16.00", isClosed: false },
      { day: "Sabtu", open: "09.00", close: "16.00", isClosed: false },
      { day: "Minggu", open: "09.00", close: "16.00", isClosed: true }
    ],
    qrisImage: ""
  };
  const profile = readStorage("sakuraMaharStoreProfile", defaultProfile);
  if (typeof profile.hours === "string") {
    profile.hours = defaultProfile.hours;
  }
  return { ...defaultProfile, ...profile };
}

function saveStoreProfile(profile) {
  writeStorage("sakuraMaharStoreProfile", profile);
  if (db) {
    db.collection("store").doc("profile").set(profile, { merge: true });
  }
}

function createOrderFromState() {
  const { product, quantity } = orderProduct();
  if (!product) return null;

  if (state.currentOrderId) {
    const existingOrder = getOrders().find((order) => order.id === state.currentOrderId);
    if (existingOrder) return existingOrder;
  }

  const buyerName =
    state.orderData?.name ||
    (state.user?.name ? formatUserName(state.user.name) : "Pelanggan Sakura Mahar");
  const order = {
    id: `MHR-${Math.floor(10000 + Math.random() * 90000)}`,
    customerName: buyerName,
    phone: state.orderData?.phone || state.user?.phone || "",
    address: state.orderData?.address || "",
    productId: product.id,
    productName: product.name,
    productImage: product.image,
    quantity,
    userId: state.user?.id || null,
    email: state.user?.email || "",
    total: product.price * quantity,
    pickupMethod: state.pickupMethod,
    status: "Belum Dibayar",
    detail: state.orderData || {},
    createdAt: new Date().toISOString()
  };

  saveOrders([order, ...getOrders()]);
  state.currentOrderId = order.id;
  writeStorage("sakuraMaharCurrentOrderId", order.id);
  return order;
}

function getStoredUsers() {
  return readStorage("sakuraMaharUsers", []);
}

function saveStoredUsers(users) {
  writeStorage("sakuraMaharUsers", users);
}

function normalizeIdentity(value) {
  return String(value || "").trim().toLowerCase();
}

function getAdminIdentifiers() {
  const storedAdmins = readStorage("sakuraMaharAdminIdentifiers", []);
  return [...new Set([...ADMIN_IDENTIFIERS, ...storedAdmins].map(normalizeIdentity).filter(Boolean))];
}

function saveAdminIdentifier(value) {
  const identity = normalizeIdentity(value);
  if (!identity) return false;
  const storedAdmins = readStorage("sakuraMaharAdminIdentifiers", []).map(normalizeIdentity).filter(Boolean);
  if (!storedAdmins.includes(identity) && !ADMIN_IDENTIFIERS.includes(identity)) {
    writeStorage("sakuraMaharAdminIdentifiers", [...storedAdmins, identity]);
  }
  return true;
}

function isAdminIdentity(value) {
  const identity = normalizeIdentity(value);
  if (!identity) return false;
  const username = identity.includes("@") ? identity.split("@")[0] : identity;
  const adminIdentifiers = getAdminIdentifiers();
  return adminIdentifiers.includes(identity) || adminIdentifiers.includes(username);
}

function isAdminUser(user) {
  if (!user) return false;
  return user.role === "admin" || isAdminIdentity(user.email) || isAdminIdentity(user.name);
}

function toSessionUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone || "",
    role: isAdminUser(user) ? "admin" : "customer"
  };
}

function setCurrentUser(user) {
  state.user = toSessionUser(user);
  if (state.user) {
    writeStorage("sakuraMaharCurrentUser", state.user);
  } else {
    localStorage.removeItem("sakuraMaharCurrentUser");
  }
}

async function hashPassword(password) {
  if (!window.crypto?.subtle) return `plain:${password}`;
  const data = new TextEncoder().encode(password);
  const buffer = await window.crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cartIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M7 8V6a5 5 0 0 1 10 0v2h2l1 12H4L5 8h2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2M12 11v6M9 14h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  `;
}

function getActiveProduct() {
  return products.find((product) => product.id === state.selectedProductId) || products[0] || null;
}

function getOrderItem() {
  const item = state.cart[0];
  const product = item ? products.find((entry) => entry.id === item.productId) : getActiveProduct();
  return {
    product: product || products[0] || null,
    quantity: item?.quantity || state.quantity || 1
  };
}

function getShowcaseItems() {
  return [products[1], products[0], products[2], products[4], products[5]].filter(Boolean);
}

function getShowcaseProducts() {
  const items = getShowcaseItems();
  if (!items.length) return [];
  const total = items.length;
  const centerIndex = ((state.featuredIndex % total) + total) % total;

  return [
    { product: items[(centerIndex - 1 + total) % total], position: "side left" },
    { product: items[centerIndex], position: "main" },
    { product: items[(centerIndex + 1) % total], position: "side right" }
  ];
}

function updateCartCount() {
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
  cartCount.closest(".cart-button")?.classList.toggle("has-items", totalItems > 0);
}

function updateAccountChip() {
  if (!accountChip) return;
  const icon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />
    </svg>
  `;

  if (state.user) {
    accountChip.innerHTML = `${icon}<span>${escapeHtml(formatUserName(state.user.name))}</span>`;
    accountChip.dataset.route = "account";
    delete accountChip.dataset.authAction;
    accountChip.classList.add("is-authenticated");
    accountChip.setAttribute("aria-label", `Buka akun ${state.user.name}`);
    accountChip.title = "Akun saya";
    return;
  }

  accountChip.innerHTML = `${icon}<span>Masuk</span>`;
  accountChip.dataset.route = "login";
  delete accountChip.dataset.authAction;
  accountChip.classList.remove("is-authenticated");
  accountChip.setAttribute("aria-label", "Masuk akun");
  accountChip.removeAttribute("title");
}

function formatUserName(name) {
  const clean = String(name || "Pengguna").trim();
  if (!clean) return "Pengguna";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function closeMenu() {
  document.body.classList.remove("menu-open");
  navToggle.setAttribute("aria-expanded", "false");
}

function handleRouteClick(event, element) {
  const authAction = element.dataset.authAction;
  if (authAction === "logout") {
    event.preventDefault();
    setCurrentUser(null);
    navigate("home");
    return;
  }

  const route = element.dataset.route;
  if (!route) return;
  event.preventDefault();
  navigate(route);
}

function navigate(route, options = {}) {
  state.route = route;
  if (options.productId) state.selectedProductId = options.productId;
  if (route === "catalog" && options.category) state.category = options.category;
  window.location.hash = route;
  render();
  closeMenu();
  app.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function addToCart(productId, quantity = 1) {
  const existing = state.cart.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    state.cart.push({ productId, quantity });
  }
  updateCartCount();
}

function setActiveOrder(productId, quantity = 1) {
  state.selectedProductId = productId;
  state.quantity = Math.max(1, quantity);
  state.cart = [{ productId, quantity: state.quantity }];
  state.currentOrderId = null;
  localStorage.removeItem("sakuraMaharCurrentOrderId");
  updateCartCount();
}

function backIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.7 6.3 9 12l5.7 5.7-1.4 1.4L6.2 12l7.1-7.1 1.4 1.4Z" />
    </svg>
  `;
}

function cartSmallIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 22a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm10 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM4.1 4H2V2h3.6l1.2 3h13.7l-2 8.2a3 3 0 0 1-2.9 2.3H8.1A3 3 0 0 1 5.2 13L4.1 4Zm3.4 3 1.4 5.5a1 1 0 0 0 1 .8h5.7a1 1 0 0 0 1-.8L17.9 7H7.5Z" />
    </svg>
  `;
}

function shopBackTitle(title) {
  return `
    <div class="shop-title-row">
      <button class="shop-back" type="button" data-route="catalog" aria-label="Kembali">
        ${backIcon()}
      </button>
      <h1>${title}</h1>
    </div>
  `;
}

function cartPill() {
  return `
    <button class="cart-pill" type="button" data-route="checkout">
      ${cartSmallIcon()}
      <span>Keranjang</span>
    </button>
  `;
}

function checkoutStepper(activeStep) {
  const steps = [
    { number: 1, label: "Data" },
    { number: 2, label: "Bayar" },
    { number: 3, label: "Konfirmasi" }
  ];

  return `
    <div class="checkout-stepper" aria-label="Tahapan checkout">
      ${steps
        .map(
          (step, index) => `
            <div class="step-item ${activeStep >= step.number ? "active" : ""}">
              <span>${step.number}</span>
              <strong>${step.label}</strong>
            </div>
            ${index < steps.length - 1 ? `<i aria-hidden="true"></i>` : ""}
          `
        )
        .join("")}
    </div>
  `;
}

function renderEmptyShop(message = "Belum ada produk yang tersedia.") {
  return `
    <section class="shop-page catalog-page">
      <div class="catalog-content">
        <div class="empty-state">
          <strong>${escapeHtml(message)}</strong>
          <button class="button" type="button" data-route="catalog">Kembali ke Katalog</button>
        </div>
      </div>
    </section>
  `;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function showAuthMessage(form, message, type = "error") {
  const messageNode = form.querySelector(".auth-message");
  if (!messageNode) return;
  messageNode.textContent = message;
  messageNode.className = `auth-message ${type}`;
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const mode = form.dataset.authMode;
  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const users = getStoredUsers();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    showAuthMessage(form, "Email belum valid.");
    return;
  }

  if (password.length < 6) {
    showAuthMessage(form, "Kata sandi minimal 6 karakter.");
    return;
  }

  if (mode === "register") {
    const confirmPassword = String(formData.get("confirmPassword") || "");
    const phone = String(formData.get("phone") || "").trim();

    if (password !== confirmPassword) {
      showAuthMessage(form, "Konfirmasi kata sandi belum sama.");
      return;
    }

    if (!phone) {
      showAuthMessage(form, "Nomor telepon wajib diisi.");
      return;
    }

    if (users.some((user) => user.email === email)) {
      showAuthMessage(form, "Email ini sudah terdaftar. Silakan masuk.");
      return;
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      name: email.split("@")[0],
      phone,
      role: isAdminIdentity(email) ? "admin" : "customer",
      passwordHash: await hashPassword(password),
      createdAt: new Date().toISOString()
    };

    saveStoredUsers([...users, newUser]);
    setCurrentUser(newUser);
    showAuthMessage(form, "Akun berhasil dibuat. Mengalihkan...", "success");
    setTimeout(() => navigate("home"), 500);
    return;
  }

  // Default Admin Backdoor
  if (email === "admin@sakuramahar.com" && password === "M@har#2026!Admin") {
    const adminUser = {
      id: "admin-master",
      email: "admin@sakuramahar.com",
      name: "Admin",
      phone: "08000000000",
      role: "admin",
      createdAt: new Date().toISOString()
    };
    setCurrentUser(adminUser);
    showAuthMessage(form, "Login Admin berhasil. Mengalihkan...", "success");
    setTimeout(() => navigate("admin"), 500);
    return;
  }

  const foundUser = users.find((user) => user.email === email);
  const passwordHash = await hashPassword(password);

  if (!foundUser || foundUser.passwordHash !== passwordHash) {
    showAuthMessage(form, "Email atau kata sandi salah.");
    return;
  }

  const sessionUser = {
    ...foundUser,
    role: isAdminUser(foundUser) ? "admin" : foundUser.role || "customer"
  };
  if (sessionUser.role !== foundUser.role) {
    saveStoredUsers(users.map((user) => (user.id === foundUser.id ? { ...user, role: sessionUser.role } : user)));
  }
  setCurrentUser(sessionUser);
  showAuthMessage(form, "Berhasil masuk. Mengalihkan...", "success");
  setTimeout(() => navigate("home"), 500);
}

function productCard(product) {
  const safeName = escapeHtml(product.name);
  const safeSubtitle = escapeHtml(truncateText(product.subtitle || product.description, 58));
  return `
    <article class="product-card">
      <button class="product-image plain-button" type="button" data-product="${escapeHtml(product.id)}" aria-label="Lihat ${safeName}">
        <img src="${escapeHtml(product.image)}" alt="${safeName}" />
        <span class="product-badge">${escapeHtml(product.badge)}</span>
      </button>
      <div>
        <h3>${safeName}</h3>
        <p>${safeSubtitle}</p>
      </div>
      <div>
        <div class="price-row">
          <strong class="price">${formatPrice(product.price)}</strong>
          <span class="rating">&#9733;&#9733;&#9733;&#9733;&#9733; ${product.rating}</span>
        </div>
        <div class="card-actions">
          <button class="button small" type="button" data-product="${escapeHtml(product.id)}">Detail</button>
          <button class="cart-add" type="button" data-add="${escapeHtml(product.id)}" aria-label="Tambah ke keranjang">
            ${cartIcon()}
          </button>
        </div>
      </div>
    </article>
  `;
}

function filterProducts() {
  const query = state.query.trim().toLowerCase();
  return products.filter((product) => {
    const matchesCategory =
      state.category === "Semua Produk" || product.category === state.category || product.model === state.category;
    const matchesQuery =
      !query ||
      product.name.toLowerCase().includes(query) ||
      String(product.subtitle || "").toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });
}

function renderHome() {
  const featured = products.slice(0, 3);
  const showcaseProducts = getShowcaseProducts();
  const carouselClass =
    state.carouselDirection > 0 ? "slide-next" : state.carouselDirection < 0 ? "slide-prev" : "";
  const featuredStripClass = `featured-strip ${showcaseProducts.length ? carouselClass : "featured-empty"}`.trim();
  const showcaseMarkup = showcaseProducts.length
    ? `
          <button class="showcase-image ${showcaseProducts[0].position}" type="button" data-product="${showcaseProducts[0].product.id}" aria-label="Lihat ${escapeHtml(showcaseProducts[0].product.name)}">
            <img src="${escapeHtml(showcaseProducts[0].product.image)}" alt="${escapeHtml(showcaseProducts[0].product.name)}" />
          </button>
          <button class="carousel-button carousel-prev" type="button" data-carousel="-1" aria-label="Produk unggulan sebelumnya">&#8249;</button>
          <button class="showcase-image ${showcaseProducts[1].position}" type="button" data-product="${showcaseProducts[1].product.id}" aria-label="Lihat ${escapeHtml(showcaseProducts[1].product.name)}">
            <img src="${escapeHtml(showcaseProducts[1].product.image)}" alt="${escapeHtml(showcaseProducts[1].product.name)}" />
          </button>
          <button class="carousel-button carousel-next" type="button" data-carousel="1" aria-label="Produk unggulan berikutnya">&#8250;</button>
          <button class="showcase-image ${showcaseProducts[2].position}" type="button" data-product="${showcaseProducts[2].product.id}" aria-label="Lihat ${escapeHtml(showcaseProducts[2].product.name)}">
            <img src="${escapeHtml(showcaseProducts[2].product.image)}" alt="${escapeHtml(showcaseProducts[2].product.name)}" />
          </button>
        `
    : `<div class="empty-state showcase-empty">Belum ada produk unggulan.</div>`;
  const recommendationMarkup = featured.length
    ? `<div class="product-grid">${featured.map(productCard).join("")}</div>`
    : `<div class="empty-state">Belum ada produk. Admin bisa menambahkan produk baru dulu.</div>`;
  return `
    <section class="page">
      <div class="hero">
        <div class="hero-copy">
          <h1>Wujudkan <span>Momen</span><br />Spesial <span>Menjadi</span><br />Lebih <span>Berkesan</span></h1>
          <p>
            Mahar handmade elegan untuk momen spesialmu. Custom desain, detail,
            dan pilihan warna untuk pernikahan, lamaran, wisuda, dan hadiah terbaik.
          </p>
          <div class="hero-actions">
            <button class="button" type="button" data-route="catalog">Chat Custom</button>
            <button class="button primary" type="button" data-route="catalog">Beli Sekarang</button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-logo-wrap">
            <img src="assets/sakura2.png" alt="Sakura Mahar" />
          </div>
        </div>
      </div>

      <div class="perks" aria-label="Keunggulan toko">
        <article class="perk">
          <h3>Handmade</h3>
          <p>Dibingkai dengan sentuhan tangan.</p>
        </article>
        <article class="perk">
          <h3>Material Premium</h3>
          <p>Bahan pilihan dengan finishing rapi.</p>
        </article>
        <article class="perk">
          <h3>Custom Desain</h3>
          <p>Sesuai tema dan warna impian.</p>
        </article>
        <article class="perk">
          <h3>Aesthetic</h3>
          <p>Bagus untuk hadiah dan foto akad.</p>
        </article>
      </div>

      <section class="showcase" aria-labelledby="featured-title">
        <div class="section-heading center">
          <h2 id="featured-title">Produk Unggulan</h2>
        </div>
        <div class="${featuredStripClass}" aria-live="polite">
          ${showcaseMarkup}
        </div>
      </section>

      <section aria-labelledby="recommend-title">
        <div class="section-heading center">
          <h2 id="recommend-title">Yang Mungkin Anda Sukai</h2>
        </div>
        ${recommendationMarkup}
        <div class="hero-actions" style="justify-content:center">
          <button class="button" type="button" data-route="catalog">Lihat Katalog</button>
        </div>
      </section>

      <section class="reviews-section" aria-labelledby="review-title">
        <div class="section-heading center">
          <h2 id="review-title">Penilaian Produk</h2>
        </div>
        <div class="reviews-grid">
          ${["Pondok Al.", "Nur Aini", "Salsa Putri", "Vina Maharani"]
            .map(
              (name) => `
                <article class="review-card">
                  <strong>Pandu AL</strong>
                  <span class="rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                  <p>"Frame Mahar Yang Kami Pesan Rapi Banget, Warnanya Sesuai Request, Dan Hasil Akhirnya Terlihat Mewah."</p>
                </article>
              `
            )
            .join("")}
        </div>
        <a class="more-reviews" href="#catalog" data-route="catalog">Lihat Selengkapnya</a>
      </section>
    </section>
  `;
}

function renderCatalog() {
  const categories = ["Semua Produk", "Model Bingkai Mahar", "Packing"];
  const items = filterProducts();
  return `
    <section class="shop-page catalog-page">
      <div class="catalog-top">
        <div class="catalog-tabs" role="tablist" aria-label="Kategori produk">
          ${categories
            .map(
              (category) => `
                <button class="tab-button ${category === state.category ? "active" : ""}" type="button" data-category="${category}">
                  ${category}
                </button>
              `
            )
            .join("")}
        </div>
        <button class="filter-button" type="button" aria-label="Filter produk">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h9v2H4V7Zm0 8h9v2H4v-2Zm11-9h2v2h3v2h-3v2h-2v-2h-3V8h3V6Zm1 7h2v2h2v2h-2v2h-2v-2h-4v-2h4v-2Z" />
          </svg>
          <span>Urutkan</span>
        </button>
      </div>

      <div class="catalog-content">
        ${
          items.length
            ? `<div class="product-grid catalog-product-grid">${items.map(productCard).join("")}</div>`
            : `<div class="empty-state">${products.length ? "Produk tidak ditemukan." : "Belum ada produk."}</div>`
        }
      </div>
    </section>
  `;
}

function renderProduct() {
  const product = getActiveProduct();
  if (!product) return renderEmptyShop("Belum ada produk untuk dilihat.");
  return `
    <section class="shop-page product-detail-page">
      <div class="shop-flow-inner">
        ${shopBackTitle("")}
        <article class="product-detail-card">
          <div class="product-detail-image">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
          </div>
          <div class="product-detail-info">
            <h1>${escapeHtml(product.name)}</h1>
            <p>${escapeHtml(product.subtitle)}</p>
            <strong class="detail-price">${formatPrice(product.price)}</strong>
            <div class="detail-rating">
              <span class="detail-heart" aria-hidden="true">&#9825;</span>
              <span class="rating">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
              <span>${product.rating}</span>
            </div>
            <div class="detail-actions">
              <button class="button detail-outline" type="button" data-order="${escapeHtml(product.id)}" data-next="checkout">Masukan Keranjang</button>
              <button class="button primary" type="button" data-buy="${escapeHtml(product.id)}">Beli Sekarang</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderAbout() {
  const profile = getStoreProfile();
  const paragraphs = profile.description.split('\\n').filter(p => p.trim()).map(p => `<p>${escapeHtml(p)}</p>`).join("");
  const missionList = profile.mission.split('\\n').filter(p => p.trim()).map(p => `<li>${escapeHtml(p)}</li>`).join("");
  const advantagesList = profile.advantages.split('\\n').filter(p => p.trim()).map(p => `<li>${escapeHtml(p)}</li>`).join("");
  
  return `
    <section class="about-page">
      <section class="about-hero about-hero-design" aria-labelledby="about-hero-title">
        <div class="about-hero-copy">
          <h1 id="about-hero-title" class="about-brand-title">${escapeHtml(profile.name)}</h1>
          <h2>Wujudkan <span>Momen Spesial</span><br />Menjadi Lebih <span>Berkesan</span></h2>
          <p>${escapeHtml(profile.shortDesc)}</p>
        </div>
        <div class="about-hero-logo">
          <img src="assets/sakura2.png" alt="${escapeHtml(profile.name)}" />
        </div>
      </section>

      <section class="about-story" aria-labelledby="about-story-title">
        <div class="about-story-inner">
          <h2 id="about-story-title">Tentang ${escapeHtml(profile.name)}</h2>
          ${paragraphs}
        </div>
      </section>

      <section class="vision-mission-section" aria-label="Visi dan misi">
        <div class="vision-grid">
          <article class="vision-card">
            <h2>Visi</h2>
            <p>${escapeHtml(profile.vision)}</p>
          </article>
          <article class="vision-card">
            <h2>Misi</h2>
            <ul>${missionList}</ul>
          </article>
        </div>
      </section>

      <section class="values-section" aria-labelledby="values-title">
        <div class="values-heading">
          <p>Nilai Kami</p>
          <h2 id="values-title">Yang Membuat Kami Berbeda</h2>
        </div>
        <div class="values-grid">
          <article class="value-card">
            <h3>Kreativitas</h3>
            <p>${escapeHtml(profile.valueKreativitas)}</p>
          </article>
          <article class="value-card">
            <h3>Kualitas</h3>
            <p>${escapeHtml(profile.valueKualitas)}</p>
          </article>
          <article class="value-card">
            <h3>Kepuasan Pelanggan</h3>
            <p>${escapeHtml(profile.valueKepuasan)}</p>
          </article>
          <article class="value-card">
            <h3>Ketepatan</h3>
            <p>${escapeHtml(profile.valueKetepatan)}</p>
          </article>
        </div>
      </section>

      <section class="advantages-section" aria-labelledby="advantages-title">
        <div class="advantages-inner">
          <h2 id="advantages-title">Keunggulan ${escapeHtml(profile.name)}</h2>
          <div class="advantages-panel">
            <ul>${advantagesList}</ul>
          </div>
        </div>
      </section>

      <section class="business-section" aria-labelledby="business-title">
        <article class="business-card">
          <p class="business-eyebrow">Informasi Bisnis</p>
          <h2 id="business-title">Mari Berkenalan</h2>
          <p class="business-intro">
            Tim kami siap membantu mewujudkan mahar impian Anda. Hubungi kami kapan saja.
          </p>
          <div class="business-socials" aria-label="Media sosial">
            <a href="https://www.instagram.com/${escapeHtml(profile.instagram.replace('@', ''))}" aria-label="Instagram" target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Zm4.2 3.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm5-1.6a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z" /></svg>
            </a>
            <a href="https://wa.me/${escapeHtml(profile.phone.replace(/[^0-9]/g, ''))}" aria-label="WhatsApp" target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 1 8.4 15.4L22 22l-4.8-1.5A10 10 0 1 1 12 2Zm0 2a8 8 0 0 0-6.8 12.2l.3.5-.8 2.5 2.6-.8.5.3A8 8 0 1 0 12 4Zm-3.1 4.1c.3-.3.7-.3 1-.1.2.2.9 1.2 1 1.5.1.3.1.6-.1.9l-.5.6c.5 1 1.3 1.8 2.2 2.4.8.5 1.5.8 1.9.8.2 0 .4 0 .5-.2l.6-.7c.2-.3.6-.3.9-.2.3.1 1.5.7 1.8.9.2.2.3.5.2.8-.2.8-.9 1.7-1.7 1.9-.7.2-2 .1-4.4-1.2-2.9-1.5-4.8-4.2-5-5.7-.1-.9.7-1.7 1.6-1.7Z" /></svg>
            </a>
            <a href="#catalog" data-route="catalog" aria-label="Shopee">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7V6a5 5 0 0 1 10 0v1h2.2l.8 13H4L4.8 7H7Zm2 0h6V6a3 3 0 0 0-6 0v1Zm3 4c-1 0-1.6.5-1.6 1.1 0 .5.4.8 1.4 1.1 1.8.5 2.9 1.3 2.9 2.8 0 1.4-1 2.5-2.7 2.8V20h-1.6v-1.2a5.4 5.4 0 0 1-2.5-1l.8-1.6c.8.5 1.6.8 2.4.8 1 0 1.5-.4 1.5-1 0-.6-.5-.9-1.6-1.2-1.8-.5-2.7-1.3-2.7-2.7 0-1.3.9-2.4 2.6-2.7V8h1.6v1.3c.9.1 1.7.4 2.2.8l-.8 1.6a4 4 0 0 0-1.9-.7Z" /></svg>
            </a>
            <a href="https://maps.google.com/" aria-label="Lokasi" target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 1 7 7c0 5.2-7 13-7 13S5 14.2 5 9a7 7 0 0 1 7-7Zm0 2a5 5 0 0 0-5 5c0 2.9 3.1 7.5 5 10 1.9-2.5 5-7.1 5-10a5 5 0 0 0-5-5Zm0 2.7A2.3 2.3 0 1 1 12 11.3a2.3 2.3 0 0 1 0-4.6Z" /></svg>
            </a>
          </div>
          <div class="business-list">
            <div class="business-item">
              <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 1 7 7c0 5.2-7 13-7 13S5 14.2 5 9a7 7 0 0 1 7-7Zm0 2a5 5 0 0 0-5 5c0 2.9 3.1 7.5 5 10 1.9-2.5 5-7.1 5-10a5 5 0 0 0-5-5Zm0 2.8A2.2 2.2 0 1 1 12 11.2a2.2 2.2 0 0 1 0-4.4Z" /></svg></span>
              <div><strong>${escapeHtml(profile.name)}</strong><p>${escapeHtml(profile.address)}</p></div>
            </div>
            <div class="business-item">
              <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2 1.3.4 2.6.6 4 .6.7 0 1.1.4 1.1 1.1V20c0 .7-.4 1.1-1.1 1.1C10.8 21.1 2.9 13.2 2.9 3.4c0-.7.4-1.1 1.1-1.1h3.4c.7 0 1.1.4 1.1 1.1 0 1.4.2 2.7.6 4 .1.4 0 .8-.3 1.1l-2.2 2.3Z" /></svg></span>
              <div><strong>Telepon/ WhatsApp</strong><p>${escapeHtml(profile.phone)}</p></div>
            </div>
            <div class="business-item">
              <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Zm4.2 3.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm5-1.6a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z" /></svg></span>
              <div><strong>Instagram</strong><p>${escapeHtml(profile.instagram)}</p></div>
            </div>
            <div class="business-item">
              <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7V6a5 5 0 0 1 10 0v1h2.2l.8 13H4L4.8 7H7Zm2 0h6V6a3 3 0 0 0-6 0v1Zm3 4c-1 0-1.6.5-1.6 1.1 0 .5.4.8 1.4 1.1 1.8.5 2.9 1.3 2.9 2.8 0 1.4-1 2.5-2.7 2.8V20h-1.6v-1.2a5.4 5.4 0 0 1-2.5-1l.8-1.6c.8.5 1.6.8 2.4.8 1 0 1.5-.4 1.5-1 0-.6-.5-.9-1.6-1.2-1.8-.5-2.7-1.3-2.7-2.7 0-1.3.9-2.4 2.6-2.7V8h1.6v1.3c.9.1 1.7.4 2.2.8l-.8 1.6a4 4 0 0 0-1.9-.7Z" /></svg></span>
              <div><strong>Shopee</strong><p>${escapeHtml(profile.shopee)}</p></div>
            </div>
            <div class="business-item">
              <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm1 3v4.6l3.2 3.2-1.4 1.4L11 12.4V7h2Z" /></svg></span>
              <div><strong>Jam Operasional</strong><p>${escapeHtml(profile.hours.map(h => h.isClosed ? '' : h.day + ': ' + h.open + ' - ' + h.close).filter(Boolean).join(', ') || 'Tutup Sementara')}</p></div>
            </div>
          </div>
        </article>
      </section>
    </section>
  `;
}

function orderProduct() {
  return getOrderItem();
}

function renderCheckout() {
  const { product, quantity } = orderProduct();
  if (!product) return renderEmptyShop("Keranjang masih kosong.");
  const subtotal = product.price * quantity;
  return `
    <section class="shop-page checkout-page">
      <div class="shop-flow-inner">
        <div class="shop-flow-head">
          ${shopBackTitle("Pembelian")}
          ${cartPill()}
        </div>
        <article class="purchase-card">
          <h2>Produk Dipesan</h2>
          <div class="purchase-item-row">
            <img src="${product.image}" alt="${product.name}" />
            <div>
              <strong>${escapeHtml(product.name)}</strong>
              <span>${product.price.toLocaleString("id-ID")}</span>
            </div>
            <div class="quantity-control">
              <button class="quantity-button" type="button" data-qty="-1" aria-label="Kurangi jumlah">-</button>
              <span>${quantity}</span>
              <button class="quantity-button" type="button" data-qty="1" aria-label="Tambah jumlah">+</button>
            </div>
          </div>
          <div class="purchase-total-box">
            <div><span>Sub Total</span><strong>${formatPrice(subtotal)}</strong></div>
            <div><span>Total</span><strong>${formatPrice(subtotal)}</strong></div>
          </div>
        </article>
        <button class="flow-submit" type="button" data-route="order">Lanjutkan Pemesanan</button>
      </div>
    </section>
  `;
}

function renderOrderData() {
  const { product, quantity } = orderProduct();
  if (!product) return renderEmptyShop("Keranjang masih kosong.");
  const orderData = state.orderData || {};
  void product;
  void quantity;
  return `
    <section class="shop-page checkout-page">
      <div class="shop-flow-inner">
        ${checkoutStepper(1)}
        <div class="shop-flow-head">
          ${shopBackTitle("Isi Data Pemesanan")}
          ${cartPill()}
        </div>
        <form class="order-form-card" id="orderForm">
          <h2>Data Pemesan</h2>
          <div class="order-fields">
            <label>Nama Lengkap *<input name="name" required placeholder="Masukan Nama Anda" value="${escapeHtml(orderData.name || "")}" /></label>
            <label>No HP / WhatsApp *<input name="phone" required placeholder="Masukan No Hp / Whatsapp" value="${escapeHtml(orderData.phone || "")}" /></label>
            <label>Alamat Pengiriman *<input name="address" required placeholder="Masukan Alamat Anda" value="${escapeHtml(orderData.address || "")}" /></label>
          </div>

          <div class="design-format">
            <h2>Format Desain</h2>
            <p>Upload Foto Manten</p>
            <div class="upload-row">
              <label class="upload-box" style="position: relative; overflow: hidden; cursor: pointer;">
                <input name="couplePhoto1" type="file" accept="image/*" hidden onchange="window.handleImagePreview(event)" />
                <svg viewBox="0 0 24 24" aria-hidden="true" style="position: relative; z-index: 2;"><path d="M11 16V7.8L8.2 10.6 6.8 9.2 12 4l5.2 5.2-1.4 1.4L13 7.8V16h-2Zm-5 4v-5h2v3h8v-3h2v5H6Z" /></svg>
                <span style="position: relative; z-index: 2;">Unggah Gambar</span>
                <img class="preview-img" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 18px; z-index: 1;" />
              </label>
              <label class="upload-box" style="position: relative; overflow: hidden; cursor: pointer;">
                <input name="couplePhoto2" type="file" accept="image/*" hidden onchange="window.handleImagePreview(event)" />
                <svg viewBox="0 0 24 24" aria-hidden="true" style="position: relative; z-index: 2;"><path d="M11 16V7.8L8.2 10.6 6.8 9.2 12 4l5.2 5.2-1.4 1.4L13 7.8V16h-2Zm-5 4v-5h2v3h8v-3h2v5H6Z" /></svg>
                <span style="position: relative; z-index: 2;">Unggah Gambar</span>
                <img class="preview-img" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 18px; z-index: 1;" />
              </label>
            </div>
          </div>

          <div class="order-fields custom-fields">
            <label>Nama Pendek Manten *<input name="shortNames" required placeholder="JUNA &amp; JINI" value="${escapeHtml(orderData.shortNames || "")}" /></label>
            <label>Insial Nama<input name="initials" placeholder="Opsional" value="${escapeHtml(orderData.initials || "")}" /></label>
            <label>Tanggal Pernikahan *<input name="weddingDate" required placeholder="Masukan Tanggal" value="${escapeHtml(orderData.weddingDate || "")}" /></label>
            <label>Alamat Tujuan *<input name="destination" required placeholder="Masukan Alamat" value="${escapeHtml(orderData.destination || "")}" /></label>
            <label>Jumlah Mahar Yang Di Tulis *<input name="maharAmount" required placeholder="Masukan Jumlah Mahar" value="${escapeHtml(orderData.maharAmount || "")}" /></label>
            <label>Display Uang<input name="moneyDisplay" placeholder="Di Gulung / Bentuk Kipas" value="${escapeHtml(orderData.moneyDisplay || "")}" /></label>
            <div class="split-fields">
              <label>Warna Background *<input name="backgroundColor" required placeholder="Masukan Warna" value="${escapeHtml(orderData.backgroundColor || "")}" /></label>
              <label>Warna Bunga *<input name="flowerColor" required placeholder="Masukan Warna" value="${escapeHtml(orderData.flowerColor || "")}" /></label>
            </div>
          </div>
        </form>
        <button class="flow-submit" type="submit" form="orderForm">Lanjutkan Pembayaran</button>
      </div>
    </section>
  `;
}

function renderPayment() {
  const { product, quantity } = orderProduct();
  if (!product) return renderEmptyShop("Keranjang masih kosong.");
  const total = product.price * quantity;
  const profile = getStoreProfile();
  const qrisMarkup = profile.qrisImage 
    ? `<img class="qris-image" src="${escapeHtml(profile.qrisImage)}" alt="QRIS ${escapeHtml(profile.name)}" />`
    : `<div class="qris-placeholder">Silakan hubungi admin untuk pembayaran via transfer.</div>`;

  return `
    <section class="shop-page checkout-page">
      <div class="shop-flow-inner">
        ${checkoutStepper(2)}
        <div class="shop-flow-head">
          ${shopBackTitle("Pilih Pembayaran")}
          ${cartPill()}
        </div>
        <article class="payment-flow-card">
          <h2>Pembayaran</h2>
          ${qrisMarkup}
          <div class="purchase-total-box payment-total">
            <div><span>Sub Total</span><strong>${formatPrice(total)}</strong></div>
            <div><span>Total</span><strong>${formatPrice(total)}</strong></div>
          </div>
          <div class="pickup-section">
            <h3>Pilih Metode Pengambilan</h3>
            <button class="pickup-option ${state.pickupMethod === "COD" ? "active" : ""}" type="button" data-pickup="COD">
              <span class="pickup-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M3 7h12v8H3V7Zm2 2v4h8V9H5Zm12 1h2.5l1.5 2v3h-4v-5Zm-9 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 18a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm12 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0Z" /></svg>
              </span>
              <strong>COD ( Bayar Di Tempat )</strong>
              <small>Khusus Area Kebumen</small>
            </button>
            <button class="pickup-option ${state.pickupMethod === "Pick Up" ? "active" : ""}" type="button" data-pickup="Pick Up">
              <span class="pickup-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="m12 2 8 4v12l-8 4-8-4V6l8-4Zm0 2.2L7.2 6.6 12 9l4.8-2.4L12 4.2ZM6 8.2v8.6l5 2.5v-8.6L6 8.2Zm12 0-5 2.5v8.6l5-2.5V8.2Z" /></svg>
              </span>
              <strong>Pick Up ( Ambil Di Tempat)</strong>
              <small>Khusus Area Kebumen</small>
            </button>
          </div>
        </article>
        <button class="flow-submit" type="button" data-confirm-order>Konfirmasi</button>
      </div>
    </section>
  `;
}

function renderConfirmation() {
  const { product, quantity } = orderProduct();
  if (!product) return renderEmptyShop("Keranjang masih kosong.");
  const order = state.currentOrderId ? getOrders().find((entry) => entry.id === state.currentOrderId) : null;
  const total = product.price * quantity;
  const buyerName =
    order?.customerName ||
    state.orderData?.name ||
    (state.user?.name ? formatUserName(state.user.name) : "Pelanggan Sakura Mahar");
  return `
    <section class="shop-page checkout-page">
      <div class="shop-flow-inner">
        ${checkoutStepper(3)}
        <div class="shop-flow-head">
          ${shopBackTitle("Konfirmasi")}
          ${cartPill()}
        </div>
        <article class="confirmation-card">
          <div class="success-icon" aria-hidden="true">✓</div>
          <h1>Pesanan Dikonfirmasi!</h1>
          <p>Terima Kasih Telah Mempercayakan Mahar Pernikahanmu Kepada Kami. Tim Kami Akan Segera Menghubungi Kamu.</p>
          <div class="confirmation-summary">
            <div><span>No. Pesanan</span><strong>${escapeHtml(order?.id || "MHR-44072")}</strong></div>
            <div><span>Nama</span><strong>${escapeHtml(buyerName)}</strong></div>
            <div><span>Produk</span><strong>${escapeHtml(order?.productName || product.name)}</strong></div>
            <div><span>Pengambilan</span><strong>${escapeHtml(order?.pickupMethod || state.pickupMethod)}</strong></div>
            <hr />
            <div class="grand-total"><span>Total</span><strong>${formatPrice(total)}</strong></div>
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderAuth(type) {
  const isRegister = type === "register";
  return `
    ${renderHome()}
    <div class="auth-overlay" role="presentation">
      <section class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div class="auth-welcome">
          <img src="assets/sakura2.png" alt="Sakura Mahar" />
          <h1>Selamat Datang</h1>
          <div class="welcome-stars" aria-hidden="true">&#9733;&#9733;&#9733;</div>
          <p>
            Mahar handmade elegan untuk momen spesialmu. Custom desain, estetik,
            dan penuh makna untuk pernikahan, lamaran, wisuda, dan hadiah terbaik.
          </p>
        </div>
        <form class="auth-form" id="authForm" data-auth-mode="${isRegister ? "register" : "login"}">
          <div class="auth-tabs" role="tablist" aria-label="Akun">
            <button class="${!isRegister ? "active" : ""}" type="button" data-route="login">Masuk</button>
            <button class="${isRegister ? "active" : ""}" type="button" data-route="register">Daftar</button>
          </div>
          ${
            isRegister
              ? `
                <label class="field">Email<input name="email" type="email" required placeholder="Contoh: eca@gmail.com" autocomplete="email" /></label>
                <label class="field">Kata sandi<input name="password" type="password" required placeholder="Masukkan kata sandi" autocomplete="new-password" /></label>
                <label class="field">Konfirmasi kata sandi<input name="confirmPassword" type="password" required placeholder="Masukkan kata sandi" autocomplete="new-password" /></label>
                <label class="field">No. telp<input name="phone" required placeholder="Masukkan No. telp" autocomplete="tel" /></label>
                <p class="auth-message" aria-live="polite"></p>
                <button class="button dark auth-submit" type="submit">Daftar</button>
              `
              : `
                <label class="field">Email<input name="email" type="email" required placeholder="Contoh: eca@gmail.com" autocomplete="email" /></label>
                <label class="field">Kata sandi<input name="password" type="password" required placeholder="Masukkan kata sandi" autocomplete="current-password" /></label>
                <a class="forgot-link" href="#register" data-route="register">Lupa kata sandi?</a>
                <p class="auth-message" aria-live="polite"></p>
                <button class="button dark auth-submit" type="submit">Masuk</button>
                <span class="auth-or">Atau</span>
                <div class="oauth-row">
                  <button type="button"><span>G</span> Google</button>
                  <button type="button"><span>f</span> Facebook</button>
                </div>
              `
          }
        </form>
      </section>
    </div>
  `;
}

function renderAccount() {
  if (!state.user) return renderAuth("login");

  const isAdmin = isAdminUser(state.user);
  const userOrders = getOrders().filter((order) => {
    if (order.userId) return order.userId === state.user.id;
    return order.email && order.email === state.user.email;
  });

  return `
    <section class="shop-page account-page">
      <div class="account-inner">
        <div class="account-head">
          <div>
            <p>Akun Saya${isAdmin ? " • Admin" : ""}</p>
            <h1>Halo, ${escapeHtml(formatUserName(state.user.name))}</h1>
          </div>
          <div class="account-head-actions">
            ${isAdmin ? `<button class="button account-admin-link" type="button" data-route="admin">Panel Admin</button>` : ""}
            <button class="button account-logout" type="button" data-route="home" data-auth-action="logout">Keluar</button>
          </div>
        </div>
        <div class="account-grid">
          <form class="account-card account-form" id="accountForm">
            <h2>Profil Akun</h2>
            <label>Nama<input name="name" required value="${escapeHtml(state.user.name || "")}" /></label>
            <label>Email<input name="email" value="${escapeHtml(state.user.email || "")}" disabled /></label>
            <label>No. HP<input name="phone" value="${escapeHtml(state.user.phone || "")}" placeholder="Masukkan nomor HP" /></label>
            <p class="account-message" aria-live="polite"></p>
            <button class="flow-submit" type="submit">Simpan Profil</button>
          </form>
          <article class="account-card">
            <h2>Riwayat Pesanan</h2>
            ${
              userOrders.length
                ? `<div class="account-orders">
                    ${userOrders
                      .map(
                        (order) => `
                          <div class="account-order">
                            <img src="${escapeHtml(order.productImage)}" alt="${escapeHtml(order.productName)}" />
                            <div>
                              <strong>${escapeHtml(order.id)}</strong>
                              <span>${escapeHtml(order.productName)}</span>
                              <small>${escapeHtml(order.status)} • ${formatPrice(order.total)}</small>
                            </div>
                          </div>
                        `
                      )
                      .join("")}
                  </div>`
                : `<div class="account-empty">Belum ada pesanan di akun ini.</div>`
            }
          </article>
        </div>
      </div>
    </section>
  `;
}

function renderAdminGate() {
  return `
    <section class="shop-page account-page">
      <div class="account-inner">
        <article class="account-card admin-gate">
          <img src="assets/sakura2.png" alt="Sakura Mahar" />
          <h1>Akses Admin</h1>
          <p>Masuk memakai akun admin untuk membuka panel pengelolaan toko.</p>
          <div class="admin-gate-actions">
            <button class="button primary" type="button" data-route="login">Masuk Admin</button>
            <button class="button" type="button" data-route="home">Beranda</button>
          </div>
        </article>
      </div>
    </section>
  `;
}

function adminCategories() {
  return ["Semua Produk", "Model Bingkai Mahar", "Packing"];
}

function adminProductItems() {
  return products.filter((product) => {
    return (
      state.adminCategory === "Semua Produk" ||
      product.category === state.adminCategory ||
      product.model === state.adminCategory
    );
  });
}

function adminProductCard(product) {
  return `
    <article class="admin-product-card">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />
      <h3>${escapeHtml(product.name)}</h3>
      <p>${escapeHtml(truncateText(product.subtitle, 58))}</p>
      <strong>${formatPrice(product.price)}</strong>
      <div class="admin-card-actions">
        <button type="button" data-edit-product="${escapeHtml(product.id)}">Edit</button>
        <button type="button" data-delete-product="${escapeHtml(product.id)}">Hapus</button>
      </div>
    </article>
  `;
}

function renderAdminProducts() {
  const items = adminProductItems();
  return `
    <div class="admin-category-tabs" role="tablist" aria-label="Kategori admin produk">
      ${adminCategories()
        .map(
          (category) => `
            <button class="${state.adminCategory === category ? "active" : ""}" type="button" data-admin-category="${category}">
              ${category}
            </button>
          `
        )
        .join("")}
    </div>
    ${
      items.length
        ? `<div class="admin-product-grid">${items.map(adminProductCard).join("")}</div>`
        : `<div class="admin-empty">Belum ada produk. Tambahkan produk baru dulu.</div>`
    }
    <button class="admin-add-button" type="button" data-admin-view="form">Tambah Produk</button>
  `;
}

function renderAdminProductForm() {
  const product = state.editProductId ? products.find((item) => item.id === state.editProductId) : null;
  const isEdit = Boolean(product);
  const selectedCategory = product?.category || "Model Bingkai Mahar";
  const pickups = product?.pickups || ["COD", "Pick Up"];

  return `
    <div class="admin-form-head new-head">
      <button class="shop-back circle-back" type="button" data-admin-view="list" aria-label="Kembali">${backIcon()}</button>
      <h2>${isEdit ? "Edit Produk" : "Tambah Produk"}</h2>
    </div>
    <form class="admin-product-form new-form" id="adminProductForm" data-edit-id="${isEdit ? escapeHtml(product.id) : ""}">
      <div class="admin-upload-row new-upload-row">
        <label class="admin-upload-box new-upload-box" style="position: relative;">
          <input name="image" type="file" accept="image/*" hidden onchange="window.handleImagePreview(event)" />
          <svg viewBox="0 0 24 24" aria-hidden="true" style="position: relative; z-index: 2;"><path d="M11 16V7.8L8.2 10.6 6.8 9.2 12 4l5.2 5.2-1.4 1.4L13 7.8V16h-2Zm-5 4v-5h2v3h8v-3h2v5H6Z" /></svg>
          <span style="position: relative; z-index: 2;">${product?.image ? "Ganti Gambar" : "Unggah Gambar"}</span>
          <img class="preview-img" src="${product?.image || ''}" style="display: ${product?.image ? 'block' : 'none'}; position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 12px; z-index: 1;" />
        </label>
        <label class="admin-upload-box new-upload-box" style="position: relative;">
          <input name="galleryImage" type="file" accept="image/*" hidden onchange="window.handleImagePreview(event)" />
          <svg viewBox="0 0 24 24" aria-hidden="true" style="position: relative; z-index: 2;"><path d="M11 16V7.8L8.2 10.6 6.8 9.2 12 4l5.2 5.2-1.4 1.4L13 7.8V16h-2Zm-5 4v-5h2v3h8v-3h2v5H6Z" /></svg>
          <span style="position: relative; z-index: 2;">Unggah Gambar</span>
          <img class="preview-img" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 12px; z-index: 1;" />
        </label>
      </div>
      <label>Nama Produk *<input name="name" required placeholder="Masukan Nama Produk" value="${escapeHtml(product?.name || "")}" /></label>
      <label>Deskripsi Produk *<textarea name="subtitle" required placeholder="Masukan Deskripsi Produk" rows="3">${escapeHtml(product?.subtitle || "")}</textarea></label>
      <label>Kategori *
        <select name="category" required>
          ${adminCategories()
            .filter((category) => category !== "Semua Produk")
            .map((category) => `<option value="${category}" ${selectedCategory === category ? "selected" : ""}>${category}</option>`)
            .join("")}
        </select>
      </label>
      <label>Harga *<input name="price" required inputmode="numeric" placeholder="Atur Harga Produk" value="${product?.price || ""}" /></label>
      <label>Stock *<input name="stock" required inputmode="numeric" placeholder="Masukan Jumlah Mahar" value="${product?.stock ?? 1}" /></label>
      <fieldset class="admin-checkboxes">
        <legend>Pengambilan Barang *</legend>
        <label class="checkbox-label"><input type="checkbox" name="pickups" value="COD" ${pickups.includes("COD") ? "checked" : ""} /> COD</label>
        <label class="checkbox-label"><input type="checkbox" name="pickups" value="Pick Up" ${pickups.includes("Pick Up") ? "checked" : ""} /> Pick Up</label>
      </fieldset>
      <p class="admin-message" aria-live="polite"></p>
    </form>
    <button class="admin-form-submit new-submit" type="submit" form="adminProductForm">${isEdit ? "Simpan Produk" : "Upload Produk"}</button>
  `;
}

function renderAdminOrders() {
  const tabs = ["Belum Dibayar", "Diproses", "Selesai"];
  const orders = getOrders().filter((order) => order.status === state.adminOrderTab);

  return `
    <div class="admin-order-tabs new-order-tabs" role="tablist" aria-label="Status pesanan">
      ${tabs
        .map(
          (tab) => `
            <button class="${state.adminOrderTab === tab ? "active" : ""}" type="button" data-admin-order-tab="${tab}">
              ${tab}
            </button>
          `
        )
        .join("")}
    </div>
    ${
      orders.length
        ? `<div class="admin-order-list new-order-list">
            ${orders
              .map((order) => {
                const isUnpaid = order.status === "Belum Dibayar";
                const isProcessing = order.status === "Diproses";
                const isDone = order.status === "Selesai";
                const badgeText = isUnpaid ? "Belum Bayar" : order.status;
                const badgeClass = order.status.replace(/\\s+/g, '-').toLowerCase();

                return `
                  <article class="admin-order-card new-card">
                    <div class="card-header">
                      <strong>${escapeHtml(order.customerName)}</strong>
                      <span class="status-badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <p class="product-name">${escapeHtml(order.productName)}</p>
                    
                    <div class="card-footer">
                      <a href="#order" class="detail-link">Rincian Pesanan</a>
                      <div class="card-actions">
                        ${isUnpaid ? `
                          <div class="unpaid-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                            <strong class="price-val">${formatPrice(order.total)}</strong>
                            <div class="button-group-vertical">
                              <button type="button" class="btn-solid-pink" data-order-status="${escapeHtml(order.id)}" data-status="Diproses">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                                Konfirmasi & Proses
                              </button>
                            </div>
                          </div>` : isProcessing ? `
                          <div class="button-group-horizontal">
                            <strong class="price-val">${formatPrice(order.total)}</strong>
                            <button type="button" class="btn-solid-pink" data-order-status="${escapeHtml(order.id)}" data-status="Selesai">
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                              Selesaikan Pesanan
                            </button>
                          </div>
                        ` : `
                          <strong class="price-only">${formatPrice(order.total)}</strong>
                        `}
                      </div>
                    </div>
                  </article>
                `;
              })
              .join("")}
          </div>`
        : `<div class="admin-empty">Belum ada pesanan di status ini.</div>`
    }
  `;
}

function renderAdminMessages() {
  const orders = getOrders();
  return `
    ${
      orders.length
        ? `<div class="admin-message-list">
            ${orders
              .map(
                (order) => `
                  <article class="admin-message-card">
                    <strong>${escapeHtml(order.customerName)}</strong>
                    <p>${escapeHtml(order.phone || "Nomor belum diisi")}</p>
                    <span>${escapeHtml(order.detail?.address || order.address || "Alamat belum diisi")}</span>
                  </article>
                `
              )
              .join("")}
          </div>`
        : `<div class="admin-empty">Belum ada pesan pelanggan.</div>`
    }
  `;
}

function renderAdminProfile() {
  const profile = getStoreProfile();
  
  const hoursHTML = profile.hours.map((h, i) => `
    <div class="hours-row">
      <span class="day-label">${h.day}</span>
      <input type="time" name="hours_${i}_open" value="${h.open.replace('.', ':')}" class="time-input" />
      <span class="time-sep">-</span>
      <input type="time" name="hours_${i}_close" value="${h.close.replace('.', ':')}" class="time-input" />
      <label class="checkbox-label tutp-label"><input type="checkbox" name="hours_${i}_closed" value="true" ${h.isClosed ? "checked" : ""} /> Tutup</label>
    </div>
  `).join("");

  return `
    <form class="admin-profile-form new-form" id="storeProfileForm">
      <div class="profile-section">
        <h3>Profil Toko</h3>
        <p class="section-desc">Informasi Yang Ditampilkan Ke Pembeli</p>
        <div class="form-row-2">
          <label>Nama Toko<input name="name" required placeholder="Masukan Nama Toko" value="${escapeHtml(profile.name)}" /></label>
          <label>Keterangan Singkat<input name="shortDesc" required placeholder="Masukan Keterangan Singkat" value="${escapeHtml(profile.shortDesc)}" /></label>
        </div>
        <label>Deskripsi Toko<textarea name="description" required placeholder="Masukan Deskripsi Toko" rows="4">${escapeHtml(profile.description)}</textarea></label>
        <label>Visi Toko<textarea name="vision" required placeholder="Masukan Visi Toko" rows="3">${escapeHtml(profile.vision)}</textarea></label>
        <label>Misi Toko<textarea name="mission" required placeholder="Masukan Misi Toko" rows="3">${escapeHtml(profile.mission)}</textarea></label>
        <label>Keunggulan Toko<textarea name="advantages" required placeholder="Masukan Keunggulan Toko" rows="3">${escapeHtml(profile.advantages)}</textarea></label>
      </div>

      <div class="profile-section">
        <h3 class="section-title">Deskripsi Nilai</h3>
        <div class="form-row-2">
          <label>Kreativitas<input name="valueKreativitas" required placeholder="Masukan Deskripsi" value="${escapeHtml(profile.valueKreativitas)}" /></label>
          <label>Kualitas<input name="valueKualitas" required placeholder="Masukan Deskripsi" value="${escapeHtml(profile.valueKualitas)}" /></label>
        </div>
        <div class="form-row-2">
          <label>Kepuasan Pelanggan<input name="valueKepuasan" required placeholder="Masukan Deskripsi" value="${escapeHtml(profile.valueKepuasan)}" /></label>
          <label>Ketepatan<input name="valueKetepatan" required placeholder="Masukan Deskripsi" value="${escapeHtml(profile.valueKetepatan)}" /></label>
        </div>
      </div>

      <div class="profile-section">
        <h3 class="section-title">Deskripsi Toko</h3>
        <label>Alamat Toko<input name="address" required placeholder="Masukan Alamat Toko" value="${escapeHtml(profile.address)}" /></label>
        <label>No. Telepon<input name="phone" required placeholder="Masukan No. Telepon Toko" value="${escapeHtml(profile.phone)}" /></label>
        <label>Instagram Toko<input name="instagram" required placeholder="Masukan Link Instagram Toko" value="${escapeHtml(profile.instagram)}" /></label>
        <label>Shopee Toko..<input name="shopee" required placeholder="Masukan Link Shopee Toko" value="${escapeHtml(profile.shopee)}" /></label>
      </div>

      <div class="profile-section">
        <label>Jam Operasional..</label>
        <div class="hours-container">
          ${hoursHTML}
        </div>
      </div>
      
      <p class="admin-message profile-msg" aria-live="polite"></p>
      <div class="form-actions-right">
        <button class="btn-solid-pink profile-submit" type="submit">Simpan Profil</button>
      </div>
    </form>
    
    <div class="admin-profile-form new-form qris-form-container">
      <div class="profile-section qris-section">
        <div class="qris-header">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6z"/></svg>
          <h3>Pembayaran QRIS</h3>
        </div>
        <p class="section-desc">Upload Gambar QRIS Yang Akan Ditampilkan Ke Pembeli Saat Checkout.</p>
        <div class="qris-content">
          <label class="new-upload-box qris-box">
            <input type="file" accept="image/png, image/jpeg" hidden id="qrisInput" />
            ${profile.qrisImage ? `<img src="${profile.qrisImage}" alt="QRIS" class="qris-preview"/>` : `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h4v4H4zM16 4h4v4h-4zM4 16h4v4H4zM16 16h4v4h-4z"/></svg><span>Belum ada QRIS</span>`}
          </label>
          <div class="qris-actions">
            <button class="btn-solid-pink" type="button" onclick="document.getElementById('qrisInput').click()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              Upload Qris
            </button>
            <p class="qris-note">Format Gambar JPG/PNG. QRIS Ini Muncul Di Halaman Pembayaran Pesanan Pembeli.</p>
            <p class="admin-message qris-message" aria-live="polite"></p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAdminContent() {
  if (state.adminTab === "Produk") {
    return state.adminView === "form" ? renderAdminProductForm() : renderAdminProducts();
  }
  if (state.adminTab === "Pesanan") return renderAdminOrders();
  if (state.adminTab === "Pesan") return renderAdminMessages();
  return renderAdminProfile();
}

function renderAdmin() {
  const tabs = ["Produk", "Pesanan", "Pesan", "Profil Toko"];
  return `
    <section class="admin-panel new-admin-panel">
      <div class="admin-hero new-hero">
        <div class="hero-logo-circle">
          <img src="assets/sakura2.png" alt="Sakura Mahar" />
        </div>
        <h1>Dashboard <span>Admin</span></h1>
      </div>
      <nav class="admin-main-tabs new-main-tabs" aria-label="Navigasi admin">
        ${tabs
          .map(
            (tab) => `
              <button class="${state.adminTab === tab ? "active" : ""}" type="button" data-admin-tab="${tab}">
                ${tab}
              </button>
            `
          )
          .join("")}
      </nav>
      <div class="admin-content">
        ${renderAdminContent()}
      </div>
    </section>
  `;
}

function setAdminMessage(form, message, type = "error") {
  const messageNode = form.querySelector(".admin-message");
  if (!messageNode) return;
  messageNode.textContent = message;
  messageNode.className = `admin-message ${type}`;
}

async function handleAdminProductSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const editId = form.dataset.editId;
  const existingProduct = editId ? products.find((product) => product.id === editId) : null;
  const name = String(formData.get("name") || "").trim();
  const subtitle = String(formData.get("subtitle") || "").trim();
  const category = String(formData.get("category") || "Model Bingkai Mahar").trim();
  const price = Number(String(formData.get("price") || "").replace(/[^\d]/g, ""));
  const stock = Number(String(formData.get("stock") || "").replace(/[^\d]/g, ""));
  const pickups = formData.getAll("pickups");
  const imageFile = form.elements.image?.files?.[0];
  const image = imageFile ? await fileToDataUrl(imageFile) : existingProduct?.image;

  if (!name || !subtitle || !category || !price) {
    setAdminMessage(form, "Lengkapi data produk dulu.");
    return;
  }

  if (!pickups.length) {
    setAdminMessage(form, "Pilih minimal satu metode pengambilan.");
    return;
  }

  if (!image) {
    setAdminMessage(form, "Upload gambar produk dulu.");
    return;
  }

  const product = normalizeProduct({
    ...existingProduct,
    id: existingProduct?.id || `${slugify(name)}-${Date.now()}`,
    name,
    subtitle,
    category,
    model: category,
    price,
    stock,
    image,
    pickups,
    badge: existingProduct?.badge || "Custom",
    rating: existingProduct?.rating || 4.9,
    updatedAt: new Date().toISOString()
  });

  if (!product) {
    setAdminMessage(form, "Produk belum valid.");
    return;
  }

  products = existingProduct
    ? products.map((item) => (item.id === existingProduct.id ? product : item))
    : [product, ...products];
  saveProducts();
  state.selectedProductId = product.id;
  state.adminCategory = "Semua Produk";
  state.adminView = "list";
  state.editProductId = null;
  render();
}

function handleStoreProfileSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  
  const profile = getStoreProfile();
  const newProfile = {
    ...profile,
    name: formData.get("name"),
    shortDesc: formData.get("shortDesc"),
    description: formData.get("description"),
    vision: formData.get("vision"),
    mission: formData.get("mission"),
    advantages: formData.get("advantages"),
    valueKreativitas: formData.get("valueKreativitas"),
    valueKualitas: formData.get("valueKualitas"),
    valueKepuasan: formData.get("valueKepuasan"),
    valueKetepatan: formData.get("valueKetepatan"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    instagram: formData.get("instagram"),
    shopee: formData.get("shopee"),
    hours: [
      "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"
    ].map((day, i) => ({
      day,
      open: (formData.get(`hours_${i}_open`) || "09:00").replace(':', '.'),
      close: (formData.get(`hours_${i}_close`) || "16:00").replace(':', '.'),
      isClosed: formData.get(`hours_${i}_closed`) === "true"
    }))
  };

  saveStoreProfile(newProfile);
  setAdminMessage(form, "Profil toko berhasil disimpan.", "success");
}

function handleAccountSubmit(event) {
  event.preventDefault();
  if (!state.user) return;

  const form = event.currentTarget;
  const formData = new FormData(form);
  const updatedUser = {
    ...state.user,
    name: String(formData.get("name") || "").trim() || state.user.name,
    phone: String(formData.get("phone") || "").trim(),
    role: isAdminUser({ ...state.user, name: String(formData.get("name") || "").trim() || state.user.name })
      ? "admin"
      : "customer"
  };
  const users = getStoredUsers().map((user) =>
    user.id === updatedUser.id ? { ...user, name: updatedUser.name, phone: updatedUser.phone } : user
  );
  saveStoredUsers(users);
  setCurrentUser(updatedUser);

  const message = form.querySelector(".account-message");
  if (message) {
    message.textContent = "Profil akun berhasil disimpan.";
    message.classList.add("success");
  }
  updateAccountChip();
}

function routeTemplate() {
  if (state.route === "catalog") return renderCatalog();
  if (state.route === "product") return renderProduct();
  if (state.route === "about") return renderAbout();
  if (state.route === "checkout") return renderCheckout();
  if (state.route === "order") return renderOrderData();
  if (state.route === "payment") return renderPayment();
  if (state.route === "confirmation") return renderConfirmation();
  if (state.route === "login") return renderAuth("login");
  if (state.route === "register") return renderAuth("register");
  if (state.route === "account") return renderAccount();
  if (state.route === "admin") return isAdminUser(state.user) ? renderAdmin() : renderAdminGate();
  return renderHome();
}

function bindPageEvents() {
  app.querySelectorAll("[data-route]").forEach((element) => {
    element.addEventListener("click", (event) => {
      handleRouteClick(event, element);
    });
  });

  app.querySelectorAll("[data-product]").forEach((element) => {
    element.addEventListener("click", () => navigate("product", { productId: element.dataset.product }));
  });

  app.querySelectorAll("[data-add]").forEach((element) => {
    element.addEventListener("click", () => {
      addToCart(element.dataset.add, state.route === "product" ? state.quantity : 1);
      if (element.dataset.next) navigate(element.dataset.next);
    });
  });

  app.querySelectorAll("[data-order]").forEach((element) => {
    element.addEventListener("click", () => {
      setActiveOrder(element.dataset.order, state.quantity);
      navigate(element.dataset.next || "checkout");
    });
  });

  app.querySelectorAll("[data-buy]").forEach((element) => {
    element.addEventListener("click", () => {
      setActiveOrder(element.dataset.buy, state.quantity);
      navigate("checkout");
    });
  });

  app.querySelectorAll("[data-category]").forEach((element) => {
    element.addEventListener("click", () => {
      state.category = element.dataset.category;
      render();
    });
  });

  app.querySelectorAll("[data-carousel]").forEach((element) => {
    element.addEventListener("click", () => {
      const total = getShowcaseItems().length;
      if (!total) return;
      const direction = Number(element.dataset.carousel);
      state.carouselDirection = direction;
      state.featuredIndex = (state.featuredIndex + direction + total) % total;
      render();
      window.setTimeout(() => {
        state.carouselDirection = 0;
      }, 420);
    });
  });

  app.querySelectorAll("[data-qty]").forEach((element) => {
    element.addEventListener("click", () => {
      state.quantity = Math.max(1, state.quantity + Number(element.dataset.qty));
      if (state.cart[0]) state.cart[0].quantity = state.quantity;
      render();
    });
  });

  app.querySelectorAll("[data-pickup]").forEach((element) => {
    element.addEventListener("click", () => {
      state.pickupMethod = element.dataset.pickup;
      render();
    });
  });

  app.querySelectorAll("[data-confirm-order]").forEach((element) => {
    element.addEventListener("click", () => {
      createOrderFromState();
      navigate("confirmation");
    });
  });

  app.querySelectorAll("[data-admin-tab]").forEach((element) => {
    element.addEventListener("click", () => {
      state.adminTab = element.dataset.adminTab;
      state.adminView = "list";
      state.editProductId = null;
      render();
    });
  });

  app.querySelectorAll("[data-admin-category]").forEach((element) => {
    element.addEventListener("click", () => {
      state.adminCategory = element.dataset.adminCategory;
      render();
    });
  });

  app.querySelectorAll("[data-admin-view]").forEach((element) => {
    element.addEventListener("click", () => {
      state.adminView = element.dataset.adminView;
      if (state.adminView !== "form") state.editProductId = null;
      render();
    });
  });

  app.querySelectorAll("[data-edit-product]").forEach((element) => {
    element.addEventListener("click", () => {
      state.adminTab = "Produk";
      state.adminView = "form";
      state.editProductId = element.dataset.editProduct;
      render();
    });
  });

  app.querySelectorAll("[data-delete-product]").forEach((element) => {
    element.addEventListener("click", () => {
      const productId = element.dataset.deleteProduct;
      products = products.filter((product) => product.id !== productId);
      state.cart = state.cart.filter((item) => item.productId !== productId);
      if (state.selectedProductId === productId) state.selectedProductId = products[0]?.id || null;
      saveProducts();
      updateCartCount();
      render();
    });
  });

  app.querySelectorAll("[data-admin-order-tab]").forEach((element) => {
    element.addEventListener("click", () => {
      state.adminOrderTab = element.dataset.adminOrderTab;
      render();
    });
  });

  app.querySelectorAll("[data-order-status]").forEach((element) => {
    element.addEventListener("click", () => {
      const nextStatus = element.dataset.status;
      const orders = getOrders().map((order) =>
        order.id === element.dataset.orderStatus ? { ...order, status: nextStatus } : order
      );
      saveOrders(orders);
      state.adminOrderTab = nextStatus;
      render();
    });
  });

  const checkoutForm = app.querySelector("#checkoutForm");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (event) => {
      event.preventDefault();
      navigate("payment");
    });
  }

  const orderForm = app.querySelector("#orderForm");
  if (orderForm) {
    orderForm.addEventListener("submit", (event) => {
      event.preventDefault();
      state.orderData = Object.fromEntries(new FormData(orderForm).entries());
      state.currentOrderId = null;
      writeStorage("sakuraMaharOrderData", state.orderData);
      localStorage.removeItem("sakuraMaharCurrentOrderId");
      navigate("payment");
    });
  }

  const authForm = app.querySelector("#authForm");
  if (authForm) {
    authForm.addEventListener("submit", handleAuthSubmit);
  }

  const adminProductForm = app.querySelector("#adminProductForm");
  if (adminProductForm) {
    adminProductForm.addEventListener("submit", handleAdminProductSubmit);
  }

  const storeProfileForm = app.querySelector("#storeProfileForm");
  if (storeProfileForm) {
    storeProfileForm.addEventListener("submit", handleStoreProfileSubmit);
  }

  const accountForm = app.querySelector("#accountForm");
  if (accountForm) {
    accountForm.addEventListener("submit", handleAccountSubmit);
  }

  const qrisInput = app.querySelector("#qrisInput");
  if (qrisInput) {
    qrisInput.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const dataUrl = await fileToDataUrl(file);
      const profile = getStoreProfile();
      profile.qrisImage = dataUrl;
      saveStoreProfile(profile);
      render();
    });
  }
}

function render() {
  app.innerHTML = routeTemplate();
  document.body.classList.toggle("auth-open", state.route === "login" || state.route === "register");
  document.body.classList.toggle("admin-open", state.route === "admin" && isAdminUser(state.user));
  const activeRoute =
    state.route === "login" || state.route === "register" || state.route === "account"
      ? "home"
      : ["product", "checkout", "order", "payment", "confirmation"].includes(state.route)
        ? "catalog"
        : state.route;
  document.querySelectorAll(".site-nav a").forEach((link) => {
    link.classList.toggle("active", link.dataset.route === activeRoute);
  });
  bindPageEvents();
  updateCartCount();
  updateAccountChip();
}

document.querySelectorAll("[data-route]").forEach((element) => {
  element.addEventListener("click", (event) => {
    handleRouteClick(event, element);
  });
});

navToggle.addEventListener("click", () => {
  const open = !document.body.classList.contains("menu-open");
  document.body.classList.toggle("menu-open", open);
  navToggle.setAttribute("aria-expanded", String(open));
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  if (state.route !== "catalog") {
    state.route = "catalog";
    window.location.hash = "catalog";
  }
  render();
});

window.addEventListener("hashchange", () => {
  const route = window.location.hash.replace("#", "") || "home";
  state.route = route;
  render();
});

const initialRoute = window.location.hash.replace("#", "") || "home";
state.route = initialRoute;
render();

window.handleImagePreview = function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const box = event.target.parentElement;
      const img = box.querySelector('.preview-img');
      if (img) {
        img.src = e.target.result;
        img.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }
};

