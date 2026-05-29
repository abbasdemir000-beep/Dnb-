import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { networkInterfaces } from 'node:os';
import assistantHandler from './api/assistant.mjs';

const root = resolve(process.env.STATIC_ROOT || process.cwd());
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function isInsideRoot(filePath) {
  const rel = relative(root, filePath);
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith('/'));
}

function localNetworkUrls() {
  const urls = [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
  for (const interfaces of Object.values(networkInterfaces())) {
    for (const item of interfaces || []) {
      if (item.family === 'IPv4' && !item.internal) {
        urls.push(`http://${item.address}:${port}`);
      }
    }
  }
  return urls;
}

async function resolveRequestPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const safePath = normalize(decodedPath).replace(/^[/\\]+/, '');
  let filePath = join(root, safePath || 'index.html');

  if (!isInsideRoot(filePath)) return null;

  const info = await stat(filePath).catch(() => null);
  if (info?.isDirectory()) filePath = join(filePath, 'index.html');
  return filePath;
}

const server = createServer(async (request, response) => {
  if (request.url === '/api/assistant') {
    await assistantHandler(request, response);
    return;
  }

  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ ok: true, app: 'Iraq.ai MVP' }));
    return;
  }

  const filePath = await resolveRequestPath(request.url || '/');
  if (!filePath) {
    response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  const info = await stat(filePath).catch(() => null);
  if (!info?.isFile()) {
    response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    response.end(await readFile(join(root, 'index.html'), 'utf8'));
    return;
  }

  const type = contentTypes[extname(filePath)] || 'application/octet-stream';
  response.writeHead(200, {
    'content-type': type,
    'cache-control': 'no-store'
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log('\nIraq.ai MVP is running.');
  console.log('Open one of these links:');
  for (const url of localNetworkUrls()) console.log(`  - ${url}`);
  console.log('\nIf you are in Codespaces/Gitpod/Replit/Cursor cloud, open the forwarded port 4173.');
  console.log('Do not open index.html directly with file:// because browser fetch blocks seed data.\n');
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
