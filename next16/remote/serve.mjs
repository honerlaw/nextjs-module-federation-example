// Tiny static server with CORS for dist/{browser,node}.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "dist");
http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": "application/javascript", "access-control-allow-origin": "*", "cache-control": "no-store" });
  fs.createReadStream(file).pipe(res);
}).listen(4001, () => console.log("remote assets on http://localhost:4001"));
