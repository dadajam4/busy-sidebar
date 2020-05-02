const path = require('path');

module.exports = {
  entry: 'src/lib/index.ts',
  babel: true,
  typescript: {
    tsconfigOverride: {
      include: [path.join(__dirname, 'src/lib/**/*')],
      exclude: [path.join(__dirname, 'types')],
    },
  },
  vue: false,
  sass: false,
  postcss: false,
  autoprefixer: false,
  // external: ['vue'],
  // globals: {
  //   vue: 'Vue',
  // },
};
