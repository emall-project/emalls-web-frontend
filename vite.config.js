import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

function postOnlyApiGuard() {
  const postOnlyPaths = new Set([
    '/catalog/products/all',
    '/catalog/products/summary',
    '/catalog/products/by-ids',
  ]);

  const sortMap = {
    'createdAt,desc': 'newest',
    'createdAt,asc': 'oldest',
    'id,desc': 'newest',
    'id,asc': 'oldest',
  };

  return {
    name: 'post-only-api-guard',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const method = (req.method || 'GET').toUpperCase();
        const rawUrl = req.url || '';
        const path = rawUrl.split('?')[0];

        if (method === 'GET' && postOnlyPaths.has(path)) {
          const accept = String(req.headers.accept || '');

          if (path === '/catalog/products/all' && accept.includes('text/html')) {
            const currentUrl = new URL(rawUrl, 'http://localhost');
            const sourceParams = currentUrl.searchParams;
            const nextParams = new URLSearchParams();

            const pageValue = Number(sourceParams.get('page'));
            if (Number.isFinite(pageValue) && pageValue >= 0) {
              nextParams.set('page', String(pageValue + 1));
            }

            const mappedSort = sortMap[sourceParams.get('sort') || ''];
            if (mappedSort) {
              nextParams.set('sort', mappedSort);
            }

            [
              'q',
              'slug',
              'categoryId',
              'brandId',
              'mallId',
              'storeId',
              'targetedAudience',
              'ageGroup',
              'minPrice',
              'maxPrice',
              'tags',
            ].forEach((key) => {
              const value = sourceParams.get(key);
              if (value != null && value !== '') {
                nextParams.set(key, value);
              }
            });

            const redirectTarget = `/products${nextParams.toString() ? `?${nextParams.toString()}` : ''}`;
            res.statusCode = 302;
            res.setHeader('Location', redirectTarget);
            res.end();
            return;
          }

          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({
            status: 405,
            error: 'Method Not Allowed',
            message: `Open this endpoint with POST, not GET. Opening ${path} in the browser address bar sends GET and cannot include the JSON body this API expects.`,
            expectedMethod: 'POST',
            expectedBodyType: 'application/json',
            note: 'The frontend already calls this endpoint correctly through fetch; use the app pages or Postman for manual testing.',
          }));
          return;
        }

        next();
      });
    },
  };
}

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
    plugins: [postOnlyApiGuard(), react(), tailwindcss()],
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
