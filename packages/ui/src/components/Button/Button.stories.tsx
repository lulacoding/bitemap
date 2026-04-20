import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button.web';

const meta: Meta<typeof Button> = {
  component: Button,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Button>;

const common = { children: 'Post Catch', onPress: () => {} } as const;

export const Primary: Story = { args: common };
export const Secondary: Story = { args: { ...common, variant: 'secondary' } };
export const Ghost: Story = { args: { ...common, variant: 'ghost' } };
export const Danger: Story = { args: { ...common, variant: 'danger', children: 'Delete' } };
export const Disabled: Story = { args: { ...common, disabled: true } };
export const Loading: Story = { args: { ...common, loading: true } };
export const Small: Story = { args: { ...common, size: 'sm' } };
export const Large: Story = { args: { ...common, size: 'lg' } };
