const readFileSync = require('fs').readFileSync;
const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('uname -a', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conne.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).on('stderr', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).on('error', err => {
  console.log('Client :: error', err);
}).on('end', () => {
  console.log('Client :: end');
});

conn.connect({
  host: '212.2.253.247',
  port: 22,
  username: 'root',
  password: 'cAh2TrVUlG'
});
