const fs = require("fs");
let content = fs.readFileSync("script.js", "utf8");

ERR=
content = content.replace(
  "</article>\n        </div>\n      </div>",
  `</article>
          <article class="account-card account-chat-card">
            <h2>Live Chat dengan Seller</h2>
            <div class="chat-messages" id="userChatMessages" aria-live="polite">
              <div class="chat-loading">Memuat chat...</div>
            </div>
            <form class="chat-input-form" id="userChatForm">
              <input type="text" name="message" placeholder="Tanya tentang pesanan Anda..." required autocomplete="off" />
              <button type="submit" aria-label="Kirim Pesan" class="send-btn">
                <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </form>
          </article>
        </div>
      </div>`
);

content = content.replace(
  `    </form>\n    \n    <div class="admin-profile-form new-form qris-form-container">\n      <div class="profile-section qris-section">`,
  `    </form>
    
    <div class="admin-profile-form new-form wa-bot-form-container" style="margin-top: 2rem;">
      <div class="profile-section">
        <div class="qris-header" style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.93.55 3.73 1.5 5.23L2 22l4.82-1.48A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.63 0-3.17-.39-4.54-1.07l-.33-.16-3.37 1.04.9-3.23-.18-.34A7.95 7.95 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/></svg>
          <h3>WhatsApp Bot Pairing</h3>
        </div>
        <p class="section-desc" style="margin-bottom:1rem;">Masukkan nomor WhatsApp (diawali 62) untuk mendapatkan kode pairing bot. Pastikan bot Node.js sudah berjalan di terminal Anda.</p>
        <div class="form-row" style="display: flex; gap: 15px; align-items: stretch;">
          <input type="text" id="waBotNumberInput" placeholder="Contoh: 62812345678" style="padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); flex: 1; outline: none; font-size: 0.95rem;" />
          <button type="button" id="btnRequestPairing" class="btn-solid-pink" style="white-space: nowrap; margin-top: 0; padding: 0 1.5rem;">Dapatkan Kode</button>
        </div>
        <div id="waBotPairingCode" style="margin-top: 15px; font-weight: bold; font-size: 1.5rem; color: var(--primary-color); letter-spacing: 2px;"></div>
      </div>
    </div>

    <div class="admin-profile-form new-form qris-form-container" style="margin-top: 2rem;">
      <div class="profile-section qris-section">`
);

content = content.replace(
  `  const qrisInput = app.querySelector("#qrisInput");
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
}`,
  `  const qrisInput = app.querySelector("#qrisInput");
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

  const userChatForm = app.querySelector("#userChatForm");
  if (userChatForm) {
    userChatForm.addEventListener("submit", handleUserChatSubmit);
    if (typeof initChatListener === "function") initChatListener();
  }

  if (typeof initWABotAdminEvents === "function") initWABotAdminEvents();
}`
);

const logic = `\n\n// ====== WA BOT PAIRING & CHAT ====== \n\nfunction initChatListener() {\n  const messagesContainer = document.getElementById("wserChatMessages");\n  if (!messagesContainer || !state.user || !db) return;\n\n  if (window.chatUnsubscribe) window.chatUnsubscribe();\n  \n  window.chatUnsubscribe = db.collection("chats").doc(state.user.id).collection("messages")\n    .orderBy("timestamp", "asc")\n    .onSnapshot((snapshot) => {\n      messagesContainer.innerHTML = \"\";\n      if (snapshot.empty) {\n        messagesContainer.innerHTML = \<div class=\"chat-loading\">Belum ada pesan. Mulai percakapan dengan penjual.</div>\;\n        return;\n      }\n      \n      snapshot.forEach((doc) => {\n        const msg = doc.data();\n        const div = document.createElement(\"div\");\n        div.className = \chat-message ${msg.sender === \"user\" ? \"user\" : \"seller\"}\;\n        \n        let timeString = \"\";\n        if (msg.timestamp) {\n          const date = msg.timestamp.toDate();\n          timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });\n        }\n        \n        div.innerHTML = \\n          ${escapeHtml(msg.text)}\n          <span class=\"chat-message-time\">${timeString}</span>\n        \;\n        messagesContainer.appendChild(div);\n      });\n      \n      messagesContainer.scrollTop = messagesContainer.scrollHeight;\n    });\n}\n\nfunction handleUserChatSubmit(e) {\n  e.preventDefault();\n  if (!state.user || !db) return;\n  \n  const form = e.target;\n  const input = form.message;\n  const text = input.value.trim();\n  if (!text) return;\n  \n  input.disabled = true;\n  \n  db.collection("chats").doc(state.user.id).collection("messages").add({\n    text: text,\n    sender: \"user\",\n    userEmail: state.user.email,\n    timestamp: firebase.firestore.FieldValue.serverTimestamp()\n  }).then(() => {\n    input.value = \"\";\n    input.disabled = false;\n    input.focus();\n  }).catch((err) => {\n    console.error(\"Error sending message:\", err);\n    input.disabled = false;\n  });\n}\n\nfunction initWABotAdminEvents() {\n  const btnRequestPairing = document.querySelector("#btnRequestPairing");\n  if (btnRequestPairing) {\n    btnRequestPairing.addEventListener(\"click\", () => {\n      const phoneInput = document.querySelector("#waBotNumberInput");\n      const phone = phoneInput.value.trim();\n      if (!phone) return alert(\"Masukkan nomor WhatsApp (diawali 62)!\");\n      if (!db) return alert(\"Database Firebase belum terhubung!\");\n\n      const display = document.querySelector(\"#waBotPairingCode\");\n      display.textContent = \"Meminta kode ke bot...\";\n      \n      db.collection("settings").doc("wa-bot").set({\n        phone: phone,\n        status: \"requesting\",\n        code: null\n      }, { merge: true }).then(() => {\n        const unsub = db.collection("settings").doc("wa-bot").onSnapshot(doc => {\n          const data = doc.data();\n          if (data && data.code) {\n            display.textContent = \"Kode: \" + data.code;\n            unsub();\n          } else if (data && data.status === \"error\") {\n            display.textContent = \"Error: \" + data.error;\n            unsub();\n          }\n        });\n      }).catch(err => {\n        display.textContent = \"Error Firestore: \" + err.message;\n      });\n    });\n  }\n}\n`;
content += logic;
fs.writeFileSync("script.js", content);
console.log("script.js updated successfully.");

