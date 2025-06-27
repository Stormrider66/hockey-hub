const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'test-server', port: 3001 }));
  } else if (req.url === '/api/v1/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      console.log('Login request:', body);
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        access_token: 'test-token-' + Date.now(),
        refresh_token: 'refresh-test-token-' + Date.now(),
        user: {
          id: 1,
          email: 'player@hockeyhub.com',
          name: 'Erik Johansson',
          role: 'player'
        }
      }));
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3001, () => {
  console.log('Test server running on port 3001');
});