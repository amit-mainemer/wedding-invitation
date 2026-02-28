const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function safeResolve(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const clean = decoded.replace(/\\/g, "/");
  const joined = path.join(ROOT, clean);
  const normalized = path.normalize(joined);
  if (!normalized.startsWith(path.normalize(ROOT + path.sep))) return null;
  return normalized;
}

function send(res, code, headers, body) {
  res.writeHead(code, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, "http://localhost");
  let pathname = reqUrl.pathname;
  if (pathname === "/") pathname = "/index.html";

  const abs = safeResolve(pathname);
  if (!abs) return send(res, 400, { "Content-Type": "text/plain; charset=utf-8" }, "Bad request");

  fs.stat(abs, (err, stat) => {
    if (err) return send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found");

    if (stat.isDirectory()) {
      const idx = path.join(abs, "index.html");
      return fs.readFile(idx, (e2, data) => {
        if (e2) return send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found");
        send(res, 200, { "Content-Type": MIME[".html"], "Cache-Control": "no-store" }, data);
      });
    }

    const ext = path.extname(abs).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";

    fs.readFile(abs, (e3, data) => {
      if (e3) return send(res, 500, { "Content-Type": "text/plain; charset=utf-8" }, "Server error");
      send(res, 200, { "Content-Type": type, "Cache-Control": "no-store" }, data);
    });
  });
});

server.listen(PORT, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log(`Invitation server running at http://127.0.0.1:${PORT}`);
});

