import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Button } from '../Button/Button.web';
import { Chip } from '../Chip/Chip.web';
import { Card } from '../Card/Card.web';
import { Input } from '../Input/Input.web';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.web';
import { Avatar } from '../Avatar/Avatar.web';
import { Pin } from '../Pin/Pin.web';
import { BannerOffline } from '../BannerOffline/BannerOffline.web';

test('Button has no a11y violations', async () => {
  const { container } = render(<Button onPress={() => {}}>Post</Button>);
  expect(await axe(container)).toHaveNoViolations();
});

test('Chip has no a11y violations', async () => {
  const { container } = render(<Chip label="Snapper" />);
  expect(await axe(container)).toHaveNoViolations();
});

test('Card has no a11y violations', async () => {
  const { container } = render(
    <Card>
      <p>hello</p>
    </Card>,
  );
  expect(await axe(container)).toHaveNoViolations();
});

test('Input has no a11y violations', async () => {
  const { container } = render(<Input label="Email" value="" onChange={() => {}} />);
  expect(await axe(container)).toHaveNoViolations();
});

test('SegmentedControl has no a11y violations', async () => {
  const { container } = render(
    <SegmentedControl
      options={[
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ]}
      value="a"
      onChange={() => {}}
    />,
  );
  expect(await axe(container)).toHaveNoViolations();
});

test('Avatar has no a11y violations', async () => {
  const { container } = render(<Avatar name="Sam" />);
  expect(await axe(container)).toHaveNoViolations();
});

test('Pin has no a11y violations', async () => {
  const { container } = render(<Pin category="saltwater" />);
  expect(await axe(container)).toHaveNoViolations();
});

test('BannerOffline has no a11y violations', async () => {
  const { container } = render(<BannerOffline />);
  expect(await axe(container)).toHaveNoViolations();
});
