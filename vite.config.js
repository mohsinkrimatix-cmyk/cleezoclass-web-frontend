import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const idCardsDir = path.join(rootDir, 'backend', 'idcards');
const idCardContentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const idCardsAssetsPlugin = () => ({
  name: 'idcards-assets',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const pathname = decodeURIComponent(String(req.url || '').split('?')[0] || '');
      const prefix = pathname.startsWith('/CRM/idcards/')
        ? '/CRM/idcards/'
        : pathname.startsWith('/idcards/')
          ? '/idcards/'
          : '';

      if (!prefix) {
        next();
        return;
      }

      const relativePath = pathname.slice(prefix.length);
      const filePath = path.normalize(path.join(idCardsDir, relativePath));
      if (!filePath.startsWith(idCardsDir + path.sep) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        next();
        return;
      }

      res.setHeader('Content-Type', idCardContentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
    });
  },
  closeBundle() {
    if (!fs.existsSync(idCardsDir)) return;

    const outputDir = path.join(rootDir, 'dist', 'idcards');
    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.cpSync(idCardsDir, outputDir, { recursive: true });
  },
});

export default defineConfig({
  base: '/CRM/',    // ⭐ Important for deploying under /CRM

  plugins: [react(), idCardsAssetsPlugin()],

  resolve: {
    alias: {
      recharts: 'recharts/lib/index.js',
      process: 'process/browser',
      buffer: 'buffer',
    },
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts', 'simple-peer'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
        NodeModulesPolyfillPlugin()
      ],
    },
  },

  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
