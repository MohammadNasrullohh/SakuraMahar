const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    const { initializeApp, cert } = require("firebase-admin/app");
    const { getFirestore } = require("firebase-admin/firestore");
    const serviceAccount = require("./service-account.json");
    initializeApp({ credential: cert(serviceAccount) });
    const db = getFirestore();
    db.collection("settings").doc("wa-bot").set({ 
      status: "connected",
      phone: "6282323727606"
    }, { merge: true }).then(() => {
      console.log("SUCCESS updated phone to 6282323727606");
      process.exit(0);
    });
  `;
  
  conn.exec(`cd /var/www/wa-bot && node -e '${script.replace(/'/g, "'\\''")}'`, (err, stream) => {
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
