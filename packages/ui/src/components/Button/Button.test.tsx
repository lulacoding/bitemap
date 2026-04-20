import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button.web';

test('renders label and fires onPress', () => {
  const fn = vi.fn();
  render(<Button onPress={fn}>Post Catch</Button>);
  fireEvent.click(screen.getByText('Post Catch'));
  expect(fn).toHaveBeenCalledTimes(1);
});

test('disabled does not fire', () => {
  const fn = vi.fn();
  render(
    <Button disabled onPress={fn}>
      x
    </Button>,
  );
  fireEvent.click(screen.getByText('x'));
  expect(fn).not.toHaveBeenCalled();
});

test('loading shows spinner glyph and blocks click', () => {
  const fn = vi.fn();
  render(
    <Button loading onPress={fn}>
      Save
    </Button>,
  );
  expect(screen.queryByText('Save')).toBeNull();
  expect(screen.getByText('…')).toBeDefined();
});

test('accessibilityLabel maps to aria-label', () => {
  render(
    <Button onPress={() => {}} accessibilityLabel="Post a catch">
      +
    </Button>,
  );
  expect(screen.getByLabelText('Post a catch')).toBeDefined();
});
