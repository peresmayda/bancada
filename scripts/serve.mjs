import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/bancada-cloud.js', ['bancada-cloud.js', 'text/javascript; charset=utf-8']],
  ['/login.css', ['login.css', 'text/css; charset=utf-8']],
]);
const port = Number(process.env.PORT || 8765);
const server = createServer(async (req, res) => {
  const file = files.get(new URL(req.url, 'http://localhost').pathname);
  if (!file || !['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(404).end('Arquivo não encontrado.');
    return;
  }
  try {
    const body = await readFile(new URL('../dist/' + file[0], import.meta.url));
    res.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(503).end('Execute npm run build antes de abrir o aplicativo.');
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Bancada: http://127.0.0.1:${port}`));
