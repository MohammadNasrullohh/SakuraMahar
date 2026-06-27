const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const localFile = 'c:/Users/meong/Desktop/6IKRA/Ecommerce/mahar/wa-bot/index.js';
    const remoteFile = '/var/www/wa-bot/index.js';
    
    sftp.fastPut(localFile, remoteFile, (err) => {
      if (err) throw err;
      console.log('Successfully uploaded index.js');
      
      conn.exec('pm2 restart wa-bot', (err2, stream2) => {
        if (err2) throw err2;
        stream2.on('close', (code, signal) => {
          console.log('PM2 restart finished with code', code);
          conn.end();
        }).on('data', (data) => {
          console.log('STDOUT:', data.toString());
        }).stderr.on('data', (data) => {
          console.error('STDERR:', data.toString());
        });
      });
    });
  });
}).connect({
  host: '212.2.253.247',
  port: 22,
  username: 'root',
  password: 'cAh2TrVUlG'
});
