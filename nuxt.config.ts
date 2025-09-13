// https://nuxt.com/docs/api/configuration/nuxt-config
export default ({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

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
  },

  ui: {
    icons: ['heroicons', 'lucide'],
    global: true
  },

  typescript: {
    typeCheck: true
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
      apiUrl: process.env.API_URL
    }
  },

  vite: {
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
  },
})