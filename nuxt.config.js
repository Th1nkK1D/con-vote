import axios from 'axios'

export default async () => {
  const res = await axios.get(process.env.CONFIG_URL + '/build')

  return {
    // Disable server-side rendering (https://go.nuxtjs.dev/ssr-mode)
    ssr: false,

    // Target (https://go.nuxtjs.dev/config-target)
    target: 'static',

    // Global page headers (https://go.nuxtjs.dev/config-head)

    // Global CSS (https://go.nuxtjs.dev/config-css)
    css: ['element-ui/lib/theme-chalk/index.css', '~/assets/styles/main.scss'],

    // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
    plugins: ['@/plugins/element-ui', '@/plugins/dragscroll'],

    // Auto import components (https://go.nuxtjs.dev/config-components)
    components: true,

    // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
    buildModules: ['@nuxtjs/style-resources'],

    // Modules (https://go.nuxtjs.dev/config-modules)
    modules: [
      // https://go.nuxtjs.dev/axios
      '@nuxtjs/axios',
      'vue-plausible',
    ],
    styleResources: {
      scss: ['~/assets/styles/variables.scss'],
    },

    // Axios module configuration (https://go.nuxtjs.dev/config-axios)
    axios: {},

    // Build Configuration (https://go.nuxtjs.dev/config-build)
    build: {
      transpile: [/^element-ui/],
    },

    env: {
      CONFIG_URL: process.env.CONFIG_URL,
    },

    plausible: {
      domain: 'elect.in.th/convote-24jun21',
      apiHost: 'analytics.punchup.world',
    },

    ...res.data,
  }
}
