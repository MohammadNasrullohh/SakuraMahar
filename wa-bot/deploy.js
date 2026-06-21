const fs = require('fs');
const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('SFTP ready, creating directory...');
    conn.exec('mkdir -p /var/www/wa-bot', (err, stream) => {
      if (err) throw err;
      stream.on('close', () => {
        uploadFiles(sftp);
      }).resume();
    });
  });
}).connect({
  host: '212.2.253.247',
  port: 22,
  username: 'root',
  password: 'cAh2TrVUlG'
});

function uploadFiles(sftp) {
  const files = ['index.js', 'package.json', 'service-account.json'];
  let uploaded = 0;
  console.log('Uploading files...');
  files.forEach(file => {
    sftp.fastPut(file, '/var/www/wa-bot/' + file, (err) => {
      if (err) {
        console.error("Error uploading", file, err);
        return;
      }
      console.log(file + ' uploaded.');
      uploaded++;
      if (uploaded === files.length) {
        runSetup();
      }
    });
  });
}

function runSetup() {
  console.log('Running setup commands on VPS...');
  const cmds = `
    cd /var/www/wa-bot
    npm install
    pm2 restart wa-bot || pm2 start index.js --name wa-bot
  `;
  conn.exec(cmds, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Setup finished with code ' + code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).on('stderr', (data) => {
      process.stderr.write(data);
    });
  });
}
