import server from '../dist/server/server.js';

export default async function handler(req, res) {
  // Convert Node.js IncomingMessage to Web Request
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const url = new URL(req.url, `${protocol}://${req.headers.host}`);
  
  const init = {
    method: req.method,
    headers: req.headers,
  };
  
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req;
    init.duplex = 'half';
  }
  
  const request = new Request(url.href, init);
  
  // Call the TanStack Start fetch handler
  const response = await server.fetch(request, process.env, {});
  
  // Convert Web Response back to Node.js ServerResponse
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  
  if (response.body) {
    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) res.write(value);
      }
    } finally {
      res.end();
    }
  } else {
    res.end();
  }
}
