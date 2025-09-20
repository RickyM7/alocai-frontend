// https://nuxt.com/docs/api/configuration/nuxt-config
const isDev = process.env.NODE_ENV === 'development'

export default ({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: [
    '@nuxt/test-utils',
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
    provider: 'iconify',
    collections: ['heroicons', 'lucide'],
    serverBundle: {
      collections: ['heroicons', 'lucide']
    }
  },
  ui: {
    icons: ['heroicons', 'lucide'],
    global: true
  },
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
        }
      }
    } : {},
    optimizeDeps: {
      include: [
        '@fullcalendar/daygrid',
        '@fullcalendar/interaction',
        '@fullcalendar/timegrid',
        '@fullcalendar/vue3',
        '@vuepic/vue-datepicker'
      ]
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            calendar: ['@fullcalendar/daygrid', '@fullcalendar/interaction', '@fullcalendar/timegrid', '@fullcalendar/vue3'],
            datepicker: ['@vuepic/vue-datepicker'],
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
    payloadExtraction: !isDev,
    inlineSSRStyles: !isDev
  },
  nitro: {
    compressPublicAssets: true,
    minify: true
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