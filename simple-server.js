const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3010;

console.log(`
🏒 Hockey Hub - Simple Server
============================
This is a temporary server to view the project structure.
The full application requires dependencies to be installed.

Server running at http://localhost:${PORT}
`);

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Hockey Hub</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: #1e293b;
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .status {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .card h3 {
      margin-top: 0;
      color: #1e293b;
    }
    .card ul {
      list-style: none;
      padding: 0;
    }
    .card li {
      padding: 5px 0;
      color: #64748b;
    }
    .code {
      background: #f1f5f9;
      padding: 10px;
      border-radius: 4px;
      font-family: monospace;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏒 Hockey Hub</h1>
    <p>Comprehensive Sports Management Platform</p>
  </div>

  <div class="status">
    <h3>⚠️ Installation Required</h3>
    <p>Dependencies are being installed. To start the full application:</p>
    <div class="code">
      # Wait for installation to complete, then run:<br>
      npm run dev
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>📱 User Dashboards</h3>
      <ul>
        <li>✅ Player Dashboard</li>
        <li>✅ Coach Dashboard</li>
        <li>✅ Parent Dashboard</li>
        <li>✅ Medical Staff Dashboard</li>
        <li>✅ Equipment Manager Dashboard</li>
        <li>✅ Physical Trainer Dashboard</li>
        <li>✅ Club Admin Dashboard</li>
        <li>✅ System Admin Dashboard</li>
      </ul>
    </div>

    <div class="card">
      <h3>🛠️ Technology Stack</h3>
      <ul>
        <li>Frontend: Next.js 15.3.4</li>
        <li>UI: React 18 + TypeScript</li>
        <li>State: Redux Toolkit</li>
        <li>Styling: Tailwind CSS</li>
        <li>Backend: Node.js Microservices</li>
        <li>Database: PostgreSQL</li>
      </ul>
    </div>

    <div class="card">
      <h3>🚀 Features</h3>
      <ul>
        <li>Real-time training monitoring</li>
        <li>Medical tracking & wellness</li>
        <li>Team management</li>
        <li>Event scheduling</li>
        <li>Payment processing</li>
        <li>Analytics & reporting</li>
      </ul>
    </div>

    <div class="card">
      <h3>📂 Project Structure</h3>
      <ul>
        <li>apps/frontend - Next.js app</li>
        <li>services/* - Microservices</li>
        <li>packages/* - Shared libraries</li>
      </ul>
      <div class="code">
        Total files: 48,591<br>
        Services: 10<br>
        Dashboards: 8
      </div>
    </div>
  </div>
</body>
</html>
    `);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});