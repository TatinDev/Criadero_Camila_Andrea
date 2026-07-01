import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { createServer } from "node:http";

const root = resolve(".");
const port = Number(process.env.PORT || 4177);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png"
};

createServer((req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${port}`);
  const candidate = resolve(join(root, decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname)));
  if (!candidate.startsWith(root) || !existsSync(candidate) || !statSync(candidate).isFile()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "content-type": types[extname(candidate)] || "application/octet-stream" });
  createReadStream(candidate).pipe(res);
}).listen(port, () => {
  console.log(`criadero_camila_andrea_url=http://127.0.0.1:${port}`);
});
