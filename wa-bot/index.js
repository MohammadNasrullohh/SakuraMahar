require("dotenv").config();
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const fs = require("fs");

if (fs.existsSync("./service-account.json")) {
  const serviceAccount = require("./service-account.json");
  initializeApp({
    credential: cert(serviceAccount)
  });
  console.log("Firebase Admin initialized.");
} else {
  console.error("ERROR: service-account.json not found!");
  process.exit(1);
}

const db = getFirestore();
const SELLER_PHONE = process.env.SELLER_PHONE || "6285932884293";
const SELLER_WA_ID = `${SELLER_PHONE}@c.us`;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ["--no-sandbox"] }
});

let currentPairingPhone = null;

client.on("qr", async (qr) => {
  console.log("Waiting for pairing code request from Admin Panel... (Or scan this QR code)");
  if (currentPairingPhone) {
    try {
      console.log(`QR loaded, requesting pairing code for: ${currentPairingPhone}`);
      const code = await client.requestPairingCode(currentPairingPhone);
      console.log(`Pairing code generated: ${code}`);
      await db.collection("settings").doc("wa-bot").update({ code: code, status: "ready" });
      currentPairingPhone = null;
    } catch (err) {
      console.error("Failed to request pairing code inside QR event:", err);
      await db.collection("settings").doc("wa-bot").update({ status: "error", error: err.message });
    }
  }
});

client.on("ready", async () => {
  console.log("WhatsApp Bot is ready and connected!");
  await db.collection("settings").doc("wa-bot").set({ status: "connected" }, { merge: true });
  listenToWebsiteChats();
  listenToOrders();
});

const stickerCooldowns = new Map();
const COOLDOWN_TIME = 60000; // 60 seconds

client.on("message_create", async (msg) => {
  const text = (msg.body || "").trim().toLowerCase();
  const isAdmin = msg.fromMe || msg.from === SELLER_WA_ID;
  const chatId = msg.fromMe ? msg.to : msg.from;

  console.log(`[DEBUG] Incoming msg from ${msg.from} to ${msg.to}. Body: "${msg.body}", Media: ${msg.hasMedia}, Type: ${msg.type}`);

  let isAllowedSticker = isAdmin;
  if (!isAllowedSticker) {
    try {
      const doc = await db.collection("settings").doc("wa-bot-users").get();
      if (doc.exists && doc.data().allowed && doc.data().allowed.includes(msg.from)) {
        isAllowedSticker = true;
      }
    } catch (e) {
      console.log("[DEBUG] Error checking allowed users:", e);
    }
  }
  console.log(`[DEBUG] isAllowedSticker (Bypass Delay): ${isAllowedSticker}`);

  // Menu Command
  if (text === "#menu") {
    let menuText = `*🤖 Menu Bot Sakura Mahar*\n\nBerikut daftar perintah yang bisa kamu gunakan:\n\n🛍️ *Layanan Toko*\n- *#katalog* : Melihat katalog produk kami\n- *#status [Nomor Pesanan]* : Mengecek status pesanan kamu`;
    
    menuText += `\n\n✨ *Fitur Publik*\n- *#stiker* : Kirim gambar dengan caption #stiker untuk menjadi stiker WA`;
    
    if (isAdmin) {
      menuText += `\n\n🛡️ *Perintah Admin*\n- *#adduser [Nomor WA]* : Memberi akses stiker tanpa delay ke nomor lain (Contoh: #adduser 08123456789)\n\n💬 *(Balas pesan notifikasi bot untuk membalas Live Chat dari Web)*`;
    }
    client.sendMessage(chatId, menuText);
    return;
  }

  // Katalog Command
  if (text === "#katalog") {
    client.sendMessage(chatId, `Lihat katalog lengkap produk Sakura Mahar di:\n👉 https://mahar-alpha.vercel.app/`);
    return;
  }

  // Status Pesanan Command
  if (text.startsWith("#status ")) {
    let orderId = msg.body.trim().substring(8).trim();
    if (orderId.toLowerCase().startsWith("mhr-")) {
      orderId = "MHR-" + orderId.substring(4);
    }
    if (!orderId) {
      client.sendMessage(chatId, `⚠️ Format salah. Gunakan: #status [Nomor Pesanan]`);
      return;
    }
    try {
      const doc = await db.collection("orders").doc(orderId).get();
      if (!doc.exists) {
        client.sendMessage(chatId, `❌ Pesanan dengan nomor *${orderId}* tidak ditemukan.`);
      } else {
        const data = doc.data();
        let statusStr = "Diproses";
        if (data.status === "pending") statusStr = "Menunggu Pembayaran";
        else if (data.status === "completed") statusStr = "Selesai";
        else if (data.status === "shipped") statusStr = "Sedang Dikirim";
        else if (data.status === "cancelled") statusStr = "Dibatalkan";
        
        let total = data.total || 0;
        client.sendMessage(chatId, `📦 *Status Pesanan*\n\nID: ${orderId}\nStatus: *${statusStr}*\nTotal: Rp${total.toLocaleString("id-ID")}`);
      }
    } catch (e) {
      client.sendMessage(chatId, `⚠️ Terjadi kesalahan saat mengecek status pesanan.`);
    }
    return;
  }

  // Add User Command (Admin Only)
  if (isAdmin && text.startsWith("#adduser ")) {
    let phone = text.replace("#adduser ", "").replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) phone = "62" + phone.substring(1);
    if (!phone) {
      client.sendMessage(chatId, `⚠️ Format nomor tidak valid.`);
      return;
    }
    const waId = phone + "@c.us";
    try {
      await db.collection("settings").doc("wa-bot-users").set({
        allowed: FieldValue.arrayUnion(waId)
      }, { merge: true });
      client.sendMessage(chatId, `✅ Nomor *${phone}* berhasil diberi akses pembuatan stiker tanpa delay!`);
    } catch (e) {
      client.sendMessage(chatId, `❌ Gagal menambahkan nomor: ${e.message}`);
    }
    return;
  }

  // Sticker Warning for non-media
  if ((text === "#stiker" || text === "#sticker" || text === "#s") && !msg.hasMedia) {
    client.sendMessage(chatId, `⚠️ Silakan kirim *Gambar* atau *Video pendek* (ukuran kecil) dengan caption (keterangan) *#stiker* untuk menjadikannya stiker WhatsApp.`);
    return;
  }

  // Live Chat Reply Logic (Admin Only)
  if (msg.hasQuotedMsg) {
    console.log(`Detected quoted msg. fromMe: ${msg.fromMe}, from: ${msg.from}, to: ${msg.to}`);
    const quotedMsg = await msg.getQuotedMessage();
    console.log(`Quoted msg fromMe: ${quotedMsg.fromMe}, from: ${quotedMsg.from}`);
    if (quotedMsg.fromMe || quotedMsg.from === SELLER_WA_ID) {
      const match = quotedMsg.body.match(/ID:\s*([a-zA-Z0-9\-_]+)\)/);
      console.log(`Regex match: ${match ? match[1] : 'null'}`);
      if (match && match[1]) {
        const userId = match[1];
        try {
          let imageUrl = null;
          let textBody = msg.body;

          if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            if (media) {
              const base64Data = media.data;
              const ext = media.mimetype.split('/')[1] || 'jpg';
              imageUrl = `data:${media.mimetype};base64,${base64Data}`;
              if (textBody === "") textBody = "Pesan Gambar";
            }
          }

          const messageData = {
            text: textBody,
            sender: "seller",
            timestamp: FieldValue.serverTimestamp()
          };
          if (imageUrl) messageData.imageUrl = imageUrl;

          await db.collection("chats").doc(userId).collection("messages").add(messageData);
          client.sendMessage(SELLER_WA_ID, `✅ Balasan terkirim ke User (ID: ${userId})`);
        } catch (error) {
          console.error("Failed to save reply:", error);
          client.sendMessage(SELLER_WA_ID, `❌ Gagal mengirim balasan ke User (ID: ${userId})`);
        }
      }
    }
  }

  // Sticker Feature (Public with Delay)
  if (msg.hasMedia && (msg.type === "image" || msg.type === "video")) {
    const caption = (msg.body || "").toLowerCase().trim();
    if (caption === "#sticker" || caption === "#s" || caption === "#stiker") {
      
      // Delay check for non-whitelisted users
      if (!isAllowedSticker) {
        const lastTime = stickerCooldowns.get(msg.from) || 0;
        const nowTime = Date.now();
        if (nowTime - lastTime < COOLDOWN_TIME) {
          const waitSecs = Math.ceil((COOLDOWN_TIME - (nowTime - lastTime)) / 1000);
          client.sendMessage(chatId, `⏳ Mohon tunggu *${waitSecs} detik* lagi sebelum membuat stiker baru agar tidak spam.`);
          return;
        }
        stickerCooldowns.set(msg.from, nowTime);
      }

      try {
        const media = await msg.downloadMedia();
        if (media) {
          await client.sendMessage(chatId, media, { 
            sendMediaAsSticker: true,
            stickerName: "Sakura Sticker",
            stickerAuthor: "Bot"
          });
        }
      } catch (err) {
        console.error("Failed to create sticker:", err);
        msg.reply("❌ Gagal membuat stiker. Pastikan format medianya didukung.");
      }
    }
  }
});

client.initialize();

// Listen to Website Chats
function listenToWebsiteChats() {
  console.log("Listening for new messages from website...");
  db.collectionGroup("messages").where("sender", "==", "user").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        if (data.forwarded) return;
        const userId = change.doc.ref.parent.parent.id;
        const userEmail = data.userEmail || "Unknown";
        const userName = data.userName || "Pelanggan";
        const messageText = data.text;
        
        // Auto-reply logic (08:00 - 20:00 WIB)
        const now = new Date();
        const currentHourWIB = (now.getUTCHours() + 7) % 24;
        
        if (currentHourWIB < 8 || currentHourWIB >= 20) {
          try {
            await db.collection("chats").doc(userId).collection("messages").add({
              text: "Halo! Mohon maaf toko Sakura Mahar sedang tutup saat ini. Pesan Anda akan kami balas secepatnya besok pagi mulai pukul 08:00 WIB. Terima kasih!",
              sender: "seller",
              timestamp: FieldValue.serverTimestamp(),
              isAutoReply: true
            });
          } catch(e) {
            console.error("Failed to send auto-reply:", e);
          }
        }

        let textBody = messageText;
        if (!textBody && data.imageUrl) textBody = "Pesan Gambar";
        const waMessage = `🛎️ *Pesan Baru dari User (${userName} - ${userEmail})*\n(ID: ${userId})\n\n"${textBody}"\n\n_Balas (Reply) pesan ini untuk membalas pengguna._`;
        
        if (data.imageUrl) {
          if (data.imageUrl.startsWith("data:")) {
            try {
              const matches = data.imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              if (matches && matches.length === 3) {
                const mimeType = matches[1];
                const base64Data = matches[2];
                const media = new MessageMedia(mimeType, base64Data);
                await client.sendMessage(SELLER_WA_ID, media, { caption: waMessage });
                
                // No need to upload to storage, just mark as forwarded
                await change.doc.ref.update({ forwarded: true });
              }
            } catch (err) {
              console.error("Failed to process base64 image", err);
              client.sendMessage(SELLER_WA_ID, waMessage + `\n\n[Gagal memuat gambar]`).then(() => {
                change.doc.ref.update({ forwarded: true });
              });
            }
          } else {
            MessageMedia.fromUrl(data.imageUrl).then((media) => {
              client.sendMessage(SELLER_WA_ID, media, { caption: waMessage }).then(() => {
                change.doc.ref.update({ forwarded: true });
              });
            }).catch(err => {
              console.error("Failed to load image from url", err);
              client.sendMessage(SELLER_WA_ID, waMessage + `\n\n[Lampiran Gambar: ${data.imageUrl}]`).then(() => {
                change.doc.ref.update({ forwarded: true });
              });
            });
          }
        } else {
          client.sendMessage(SELLER_WA_ID, waMessage).then(() => {
            change.doc.ref.update({ forwarded: true });
          });
        }
      }
    });
  });
}

// Listen to Pairing Code Requests from Admin Panel
db.collection("settings").doc("wa-bot").onSnapshot(async (doc) => {
  const data = doc.data();
  if (data && data.status === "requesting" && data.phone) {
    console.log(`Requesting pairing code for phone: ${data.phone}`);
    currentPairingPhone = data.phone;
    try {
      const code = await client.requestPairingCode(data.phone);
      console.log(`Pairing code generated immediately: ${code}`);
      await doc.ref.update({ code: code, status: "ready" });
      currentPairingPhone = null;
    } catch (err) {
      console.log("Cannot generate code immediately, waiting for QR event... Error: ", err.message);
    }
  }
});

// Listen to Orders for WhatsApp Invoice Notifications
function listenToOrders() {
  console.log("Listening for new orders to send invoices...");
  db.collection("orders").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === "added" || change.type === "modified") {
        const data = change.doc.data();
        if (data.status === "Belum Dibayar" && !data.invoiceSent && data.phone) {
          let phone = data.phone.replace(/[^0-9]/g, "");
          if (phone.startsWith("0")) phone = "62" + phone.substring(1);
          
          let itemsText = `- ${data.productName} (${data.quantity}x) : Rp ${data.total.toLocaleString("id-ID")}`;

          const invoiceMsg = `Halo Kak ${data.customerName || data.name || "Pelanggan"}! 👋\n\nTerima kasih telah berbelanja di *Sakura Mahar*. Berikut adalah rincian pesanan Anda:\n\n*Order ID*: ${data.id}\n*Total Pembayaran*: Rp ${data.total ? data.total.toLocaleString("id-ID") : 0}\n\n*Rincian Barang*:\n${itemsText}\n\nSilakan lakukan pembayaran sesuai instruksi pada website kami. Pesanan Anda akan diproses setelah pembayaran terkonfirmasi.\n\nTerima kasih! 🌸`;
          
          try {
            await client.sendMessage(phone + "@c.us", invoiceMsg);
            console.log(`Invoice sent to ${phone}`);
            await change.doc.ref.update({ invoiceSent: true });
          } catch(err) {
            console.error(`Failed to send invoice to ${phone}:`, err);
          }
        }
      }
    });
  });
}

