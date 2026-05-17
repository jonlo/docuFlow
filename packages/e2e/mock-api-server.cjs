'use strict';

// Minimal HTTP server used in CI so Playwright's webServer readiness check
// can pass without a real Cloudflare Worker. All actual API responses during
// tests are intercepted by page.route() in fixtures/auth.ts — this server
// only needs to return 200 to unblock startup.

const http = require('http');

const server = http.createServer(function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  res.writeHead(200);

  if (req.url && req.url.includes('/auth/status')) {
    res.end(JSON.stringify({
      google: { provider: 'google', connected: false },
      notion: { provider: 'notion', connected: false },
      confluence: { provider: 'confluence', connected: false },
      confluenceConnected: false,
    }));
  } else {
    res.end('{}');
  }
});

server.listen(8787, function () {
  process.stdout.write('Mock API server ready on http://localhost:8787\n');
});
