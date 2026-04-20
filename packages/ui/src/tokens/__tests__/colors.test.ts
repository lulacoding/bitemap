import { colors } from '../colors';

test('primary is deep harbour blue', () => {
  expect(colors.primary).toBe('#0E5C8A');
});

test('pin palette has 5 categories', () => {
  expect(Object.keys(colors.pin)).toHaveLength(5);
});
