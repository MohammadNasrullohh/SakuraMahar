const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    const fs = require('fs');
    const path = '/var/www/wa-bot/index.js';
    let code = fs.readFileSync(path, 'utf8');

    const replaceBlock = \`db.collection("settings").doc("wa-bot").onSnapshot(async (doc) => {
  const data = doc.data();
  if (data && data.status === "requesting" && data.phone) {
    console.log(\\\`Requesting pairing code for phone: \\\${data.phone}\\\`);
    currentPairingPhone = data.phone;
    
    // If client is already connected, log out to change number
    if (client.info && client.info.wid) {
      console.log("Bot is already connected. Logging out to pair new number...");
      try {
        await client.logout();
        console.log("Logged out successfully. Restarting process...");
        process.exit(0);
      } catch (e) {
        console.error("Failed to logout. Exiting...", e);
        process.exit(1);
      }
      return;
    }

    try {
      const code = await client.requestPairingCode(data.phone);
      console.log(\\\`Pairing code generated immediately: \\\${code}\\\`);
      await doc.ref.update({ code: code, status: "ready" });
      currentPairingPhone = null;
    } catch (err) {
      console.log("Cannot generate code immediately, waiting for QR event... Error: ", err.message);
    }
  }
});\`;

    // Replace the existing onSnapshot block
    code = code.replace(/db\\.collection\\("settings"\\)\\.doc\\("wa-bot"\\)\\.onSnapshot\\(async \\(doc\\) => \\{[\\s\\S]*?\\}\\);/, replaceBlock);

    fs.writeFileSync(path, code);
    console.log("SUCCESS updated index.js");
  `;
  
  conn.exec(`node -e '${script.replace(/'/g, "'\\''")}' && pm2 restart wa-bot`, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', data => console.log('STDOUT: ' + data));
    stream.stderr.on('data', data => console.log('STDERR: ' + data));
  });
}).connect({
  host: '212.2.253.247',
  port: 22,
  username: 'root',
  password: 'cAh2TrVUlG',
  readyTimeout: 20000
});
