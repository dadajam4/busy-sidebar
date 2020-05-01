import { Configuration } from '@nuxt/types';

const config: Configuration = {
  srcDir: 'src/',

  server: {
    host: '0.0.0.0',
  },

  generate: {
    dir: 'docs',
  },

  buildModules: ['@nuxt/typescript-build'],

  head: {
    script: [
      {
        src: `//polyfill.io/v3/polyfill.min.js?features=${[
          'default',
          'es2017',
          'IntersectionObserver',
          'ResizeObserver',
        ].join('%2C')}`,
        type: 'text/javascript',
        defer: true,
      },
    ],
  },

  // plugins: ['~/plugins/lib'],
};

export default config;
