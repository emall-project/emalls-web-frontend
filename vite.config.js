import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Set VITE_LOCAL=true in a .env.local file to proxy to local services instead of the remote server.
  const isLocal = env.VITE_LOCAL === 'true';
  const REMOTE  = 'https://api.e-mall.store';

  // Local dev ports (from each service's application-dev.yaml)
  const LOCAL_PORTS = {
    accounts:      8083,
    catalog:       8081,
    campaigns:     8082,
    'order-hub':   8084,
    'media-manager': 8085,
  };

  // Builds a proxy entry for one service.
  // Remote: just forward; Nginx at api.e-mall.store handles prefix stripping.
  // Local:  hit the service directly and strip the /service-name prefix (replicating what Nginx does).
  function makeProxy(service, extra = {}) {
    if (isLocal) {
      return {
        target: `http://localhost:${LOCAL_PORTS[service]}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(new RegExp(`^/${service}`), ''),
        ...extra,
      };
    }
    return {
      target: REMOTE,
      changeOrigin: true,
      secure: false,
      ...extra,
    };
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      allowedHosts: ['e-mall.store'],
      maxBodySize: 50 * 1024 * 1024, // 50 MB — needed for media uploads
      proxy: {
        '/accounts':     makeProxy('accounts'),
        '/catalog':      makeProxy('catalog'),
        '/campaigns':    makeProxy('campaigns'),
        '/order-hub':    makeProxy('order-hub'),
        '/media-manager': makeProxy('media-manager', {
          configure: (proxy) => {
            // Remove content-length so the proxy doesn't enforce a size cap on uploads
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('content-length');
            });
          },
        }),
      },
    },
  };
});
