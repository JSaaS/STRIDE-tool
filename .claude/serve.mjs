import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Repo-roten = förälder till .claude/ där denna fil ligger.
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.css':'text/css' };

http.createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = normalize(join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(8765, () => console.log('serving on 8765'));
