const preset = require('@bitemap/ui/tailwind-preset').default;

module.exports = {
  presets: [preset],
  content: [
    './App.tsx',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
};
