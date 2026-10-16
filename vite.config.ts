import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    // GitHub Pages 使用 /avabbbb/，Cloudflare Pages / 自定义域名使用 /
    const isGitHubPages = process.env.DEPLOY_TARGET === 'github';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: react(),
      base: isGitHubPages ? '/avabbbb/' : '/',
      resolve: {
        alias: {
          '@': path.resolve(import.meta.dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules/react-router')) return 'vendor-router';
              if (id.includes('node_modules/motion')) return 'vendor-motion';
              if (id.includes('node_modules/react-markdown') || id.includes('node_modules/remark-') || id.includes('node_modules/micromark')) {
                return 'vendor-markdown';
              }
              return undefined;
            },
          }
        }
      }
    };
});
