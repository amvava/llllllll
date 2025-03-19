// index.js
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const net = require('net');
const base64 = require('base64url');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (clientWS, req) => {
  const pathname = url.parse(req.url).pathname.slice(1);
  let target;
  
  try {
    target = base64.decode(pathname).toString('utf8');
  } catch (e) {
    clientWS.close();
    return;
  }

  const [host, port] = target.split(':');
  if (!host || !port) {
    clientWS.close();
    return;
  }

  const tcpSocket = net.createConnection({ 
    host: host, 
    port: parseInt(port) 
  });

  // Forward data dari TCP ke WebSocket
  tcpSocket.on('data', (data) => {
    if (clientWS.readyState === WebSocket.OPEN) {
      clientWS.send(data);
    }
  });

  // Forward data dari WebSocket ke TCP
  clientWS.on('message', (message) => {
    if (tcpSocket.writable) {
      tcpSocket.write(message);
    }
  });

  // Handle koneksi tertutup
  tcpSocket.on('close', () => clientWS.close());
  clientWS.on('close', () => tcpSocket.end());

  // Handle error
  tcpSocket.on('error', (err) => clientWS.close());
  clientWS.on('error', (err) => tcpSocket.end());
});

server.listen(process.env.PORT || 8080, () => {
  console.log(`Server running on port ${server.address().port}`);
});
