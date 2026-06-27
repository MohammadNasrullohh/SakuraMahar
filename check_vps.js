const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('cat /var/www/wa-bot/index.js', (err, stream) => {
    if (err) throw err;
    let fullData = '';
    stream.on('close', (code, signal) => {
      console.log(fullData);
      conn.end();
    }).on('data', (data) => {
      fullData += data;
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect({
  host: '212.2.253.247',
  port: 22,
  username: 'root',
  password: 'cAh2TrVUlG',
  readyTimeout: 20000
});
