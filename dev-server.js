#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Handle root redirect
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Start with the full path
  let filePath = path.join(PUBLIC_DIR, pathname);
  
  // Check if it's a directory - try to serve index.html from that directory
  try {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      if (fs.existsSync(indexPath)) {
        filePath = indexPath;
      }
    }
  } catch (err) {
    // File doesn't exist - will handle below
  }
  
  // If the path doesn't exist, try removing trailing slash
  if (!fs.existsSync(filePath) && pathname.endsWith('/')) {
    const altPath = path.join(PUBLIC_DIR, pathname.slice(0, -1));
    if (fs.existsSync(altPath)) {
      filePath = altPath;
    }
  }
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 404 handler
        const notFoundPath = path.join(PUBLIC_DIR, '404.html');
        fs.readFile(notFoundPath, (err, notFoundData) => {
          if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
          } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(notFoundData);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }

    // Set content type
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Development server running at http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${PUBLIC_DIR}`);
  console.log(`🔗 Visit: http://localhost:${PORT}/index.html`);
  console.log(`\n📝 Note: Form will show placeholder message (Formspree integration needed)`);
  console.log(`💡 To test: http://localhost:${PORT}/contact/`);
});