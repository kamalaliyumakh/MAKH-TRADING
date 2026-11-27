import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist/trading-portal/browser');
const port = Number.parseInt(process.env.PORTAL_STATIC_PORT ?? '58581', 10);
const app = express();
const indexHtml = await fs.readFile(path.join(root, 'index.html'));

app.disable('x-powered-by');
app.use(
  express.static(root, {
    etag: true,
    fallthrough: true,
    immutable: false,
    index: false,
    maxAge: 0,
  }),
);
app.get('*path', (_request, response) => {
  response.type('html').set('Cache-Control', 'no-store').send(indexHtml);
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Portal production artifact available at http://127.0.0.1:${port}`);
});
