import { render, screen, fireEvent } from '@testing-library/react';
import { Chip } from '../Chip/Chip.web';
import { Card } from '../Card/Card.web';
import { Sheet } from '../Sheet/Sheet.web';
import { Input } from '../Input/Input.web';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.web';
import { Avatar } from '../Avatar/Avatar.web';
import { Pin } from '../Pin/Pin.web';
import { BannerOffline } from '../BannerOffline/BannerOffline.web';
import { TabBar } from '../TabBar/TabBar.web';

test('Chip renders label and fires onPress', () => {
  const fn = vi.fn();
  render(<Chip label="Snapper" onPress={fn} active />);
  fireEvent.click(screen.getByText('Snapper'));
  expect(fn).toHaveBeenCalled();
});

test('Card renders children', () => {
  render(
    <Card>
      <span>content</span>
    </Card>,
  );
  expect(screen.getByText('content')).toBeDefined();
});

test('Sheet renders when open and hides when closed', () => {
  const { rerender } = render(
    <Sheet open={false} onClose={() => {}}>
      <div>body</div>
    </Sheet>,
  );
  expect(screen.queryByText('body')).toBeNull();
  rerender(
    <Sheet open onClose={() => {}} title="Filters">
      <div>body</div>
    </Sheet>,
  );
  expect(screen.getByText('body')).toBeDefined();
  expect(screen.getByRole('dialog', { name: 'Filters' })).toBeDefined();
});

test('Input reports changes and shows error', () => {
  const fn = vi.fn();
  render(<Input label="Email" value="a" onChange={fn} error="Required" />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'b' } });
  expect(fn).toHaveBeenCalledWith('b');
  expect(screen.getByText('Required')).toBeDefined();
});

test('SegmentedControl highlights active and fires onChange', () => {
  const fn = vi.fn();
  const options = [
    { value: 'pins', label: 'Pins' },
    { value: 'heat', label: 'Heatmap' },
  ] as const;
  render(<SegmentedControl options={options} value="pins" onChange={fn} />);
  fireEvent.click(screen.getByText('Heatmap'));
  expect(fn).toHaveBeenCalledWith('heat');
});

test('Avatar shows initials fallback when no src', () => {
  render(<Avatar name="Sam Bateman" />);
  expect(screen.getByText('SB')).toBeDefined();
});

test('Pin renders svg with correct aria label', () => {
  const { container } = render(<Pin category="saltwater" alpha={0.5} />);
  const svg = container.querySelector('svg');
  expect(svg?.getAttribute('aria-label')).toBe('saltwater catch pin');
});

test('BannerOffline renders default message', () => {
  render(<BannerOffline />);
  expect(screen.getByText(/offline/i)).toBeDefined();
});

test('TabBar renders items and triggers report', () => {
  const onSelect = vi.fn();
  const onReport = vi.fn();
  const tabs = [
    { key: 'map', label: 'Map' },
    { key: 'feed', label: 'Feed' },
    { key: 'report', label: '' },
    { key: 'profile', label: 'Profile' },
    { key: 'more', label: 'More' },
  ] as const;
  render(
    <TabBar
      tabs={tabs}
      activeKey="map"
      onSelect={onSelect}
      onReportPress={onReport}
      reportIndex={2}
    />,
  );
  fireEvent.click(screen.getByText('Feed'));
  expect(onSelect).toHaveBeenCalledWith('feed');
  fireEvent.click(screen.getByLabelText('Report a catch'));
  expect(onReport).toHaveBeenCalled();
});
