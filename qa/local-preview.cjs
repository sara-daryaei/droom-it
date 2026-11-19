const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const redirects = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8')).redirects;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

function createPreviewServer() {
  return http.createServer((request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      const pathname = decodeURIComponent(url.pathname);
      if (pathname.includes('\\')) { response.writeHead(404).end(); return; }
      const segments = pathname.split('/');
      if (segments.some(segment => segment.startsWith('.') || ['node_modules', 'qa'].includes(segment))) {
        response.writeHead(404).end();
        return;
      }
      if (pathname.startsWith('/api/')) {
        response.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        response.end(JSON.stringify({ ok: false, message: 'Local preview does not connect to the database or send email.' }));
        return;
      }
      if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
      const redirect = redirects.find(entry => entry.source === pathname);
      if (redirect) { response.writeHead(307, { Location: redirect.destination + url.search }).end(); return; }
      let relative = pathname.replace(/^\/+/, '');
      if (relative === 'en' || relative === 'nl') relative += '/index.html';
      else if (relative.endsWith('/')) relative += 'index.html';
      else if (!path.extname(relative)) relative += '.html';
      const file = path.resolve(root, relative);
      const inside = path.relative(root, file);
      if (inside.startsWith('..') || path.isAbsolute(inside) || !types[path.extname(file)] || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, { 'Content-Type': types[path.extname(file)], 'Cache-Control': 'no-store' });
      if (request.method === 'HEAD') response.end();
      else fs.createReadStream(file).pipe(response);
    } catch { response.writeHead(400).end(); }
  });
}

if (require.main === module) {
  const server = createPreviewServer();
  server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => {
    console.log('DROOM IT local preview: http://127.0.0.1:' + server.address().port + '/en');
    console.log('Local API disabled: no database writes or email delivery.');
  });
}
module.exports = { createPreviewServer };
