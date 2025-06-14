import type { StorybookConfig } from '@storybook/react-webpack5';

import { join, dirname, resolve } from "path"

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')))
}
const config: StorybookConfig = {
  staticDirs: ['../public'],
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    getAbsolutePath('@storybook/addon-webpack5-compiler-swc'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-interactions'),
    {
      name: getAbsolutePath('@storybook/addon-styling-webpack'),
      options: {
        rules: [
          {
            test: /\.css$/,
            use: [
              require.resolve('style-loader'),
              {
                loader: require.resolve('css-loader'),
                options: { importLoaders: 1 },
              },
              {
                // Tailwind / PostCSS pipeline
                loader: require.resolve('postcss-loader'),
                options: { implementation: require.resolve('postcss') },
              },
            ],
          },
        ],
      },
    },
    'msw-storybook-addon',
  ],
  "framework": {
    "name": getAbsolutePath('@storybook/react-webpack5'),
    "options": {}
  },
  webpackFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': resolve(__dirname, '../src'),
    };
    config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx', ...(config.resolve.extensions || [])];
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      tty: require.resolve('tty-browserify'),
      os: require.resolve('os-browserify/browser'),
    };
    // Transpile MSW package for ESM compatibility
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /node_modules[\\/]msw[\\/].*\.js$/,
      use: {
        loader: require.resolve('babel-loader'),
        options: {
          presets: [require.resolve('@babel/preset-env')],
        },
      },
    });
    return config;
  }
};
export default config;