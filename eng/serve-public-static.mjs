import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve('dist/web-public/browser');
const port = Number.parseInt(process.env.PORT ?? '58580', 10);
const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
]);

if (!fs.existsSync(root)) {
  console.error('Public production build is missing. Run the public build first.');
  process.exit(1);
}

// Load the complete immutable build before listening. Cloud-managed workspaces
// may evict files between requests; that disk hydration is not browser work.
const artifacts = new Map();
const preload = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) preload(file);
    else if (entry.isFile()) artifacts.set(file, fs.readFileSync(file));
  }
};
preload(root);

const server = http.createServer((request, response) => {
  let decodedPath;
  try {
    const url = new URL(request.url ?? '/', 'http://localhost');
    decodedPath = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bad request');
    return;
  }
  const relativePath = decodedPath.endsWith('/')
    ? `${decodedPath.slice(1)}index.html`
    : decodedPath.slice(1);
  const candidate = path.resolve(root, relativePath);

  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bad request');
    return;
  }

  const file = artifacts.has(candidate)
    ? candidate
    : artifacts.has(path.join(candidate, 'index.html'))
      ? path.join(candidate, 'index.html')
      : null;
  if (!file) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }

  response.writeHead(200, {
    'Cache-Control':
      path.extname(file) === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    'Content-Type': mimeTypes.get(path.extname(file)) ?? 'application/octet-stream',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  });
  response.end(artifacts.get(file));
});

server.listen(port, '127.0.0.1', () => {
  console.log(
    `Public static release-candidate server listening on http://127.0.0.1:${port} (${artifacts.size} artifacts preloaded; restart after rebuilding)`,
  );
});
