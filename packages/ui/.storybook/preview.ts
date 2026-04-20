import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'surface-light',
      values: [
        { name: 'surface-light', value: '#F5FAFB' },
        { name: 'surface-dark', value: '#061822' },
      ],
    },
    controls: { matchers: { color: /(background|color)$/i } },
  },
};

export default preview;
