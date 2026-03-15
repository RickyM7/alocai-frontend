const isDev = process.env.NODE_ENV === 'development';
const apiUrl = process.env.API_URL || '';

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css', '~/assets/css/flow-layout.css'],
  modules: [
    '@nuxt/icon',
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/fonts',
    '@pinia/nuxt',
  ],
  pinia: {
    storesDirs: ['./stores/**'],
  },
  icon: {
    serverBundle: 'local'
  },
  ui: {},
  typescript: {
    typeCheck: !isDev
  },
  app: {
    head: {
      title: 'Alocaí',
      script: [
        {
          src: 'https://accounts.google.com/gsi/client',
          async: true,
          defer: true,
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      apiUrl: isDev ? '' : process.env.API_URL
    }
  },
  vite: {
    esbuild: {
      drop: !isDev ? ['console', 'debugger'] : [],
    },
    server: isDev ? {
      hmr: {
        overlay: false,
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          bypass: (req) => {
            // Se o Nuxt estiver pedindo um ícone, bloqueia o envio para o Django
            if (req.url && req.url.startsWith('/api/_nuxt_icon')) {
              return req.url;
            }
          }
        }
      }
    } : {},
    optimizeDeps: {
      include: [
        '@fullcalendar/daygrid',
        '@fullcalendar/interaction',
        '@fullcalendar/timegrid',
        '@fullcalendar/vue3'
      ]
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            calendar: ['@fullcalendar/daygrid', '@fullcalendar/interaction', '@fullcalendar/timegrid', '@fullcalendar/vue3'],
            vendor: ['vue', 'vue-router', 'pinia']
          }
        }
      },
      minify: 'esbuild',
      target: 'esnext',
      cssCodeSplit: true
    }
  },
  devServer: isDev ? {
    port: 3000,
    host: 'localhost'
  } : {},
  experimental: {
    payloadExtraction: !isDev
  },
  nitro: {
    compressPublicAssets: true,
    minify: true,
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
          'Content-Security-Policy': `default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://accounts.google.com; connect-src 'self' https://accounts.google.com https://api.iconify.design${apiUrl ? ' ' + apiUrl : ''}; img-src 'self' data: https:; font-src 'self' data:; frame-src 'self' https://accounts.google.com; frame-ancestors 'self'`
        }
      }
    }
  },
  components: {
    global: false,
    dirs: [
      {
        path: '~/components',
        pathPrefix: false,
      }
    ]
  },
  buildDir: '.nuxt'
})