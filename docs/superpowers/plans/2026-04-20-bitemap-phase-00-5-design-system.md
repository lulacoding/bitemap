# BiteMap Phase 0.5 — UX/UI Design System Package (Detailed TDD Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Build `packages/ui` as a cross-platform (RN + web) primitive library implementing the "BiteMap Ocean" design system. Every downstream screen inherits from here.

**Upstream research:** `docs/superpowers/design/bitemap-ux-research.md`. Stitch reference screens: Map home `8c9941556e004e208807c2284480a42e`, Species detail `c81107f0bc1642268c340543e8a7fd26`.

**Architecture:** Design tokens exported as TS + as Tailwind preset. Cross-platform primitives via `.native.tsx` / `.web.tsx` dual entry (preferred over `react-native-web` shim because Expo + Next.js differ on media queries and theming). Storybook hosts web variants; mobile visual QA via Expo preview builds.

**Tech Stack:** React 18, react-native, tailwindcss, nativewind v4, @storybook/nextjs, @chromaui/chromatic, jest, jest-axe, @testing-library/react, @testing-library/react-native.

---

## File Structure

```
packages/ui/
├── src/
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── radius.ts
│   │   ├── motion.ts
│   │   └── index.ts
│   ├── tailwind-preset.ts
│   ├── components/
│   │   ├── Button/ { index.ts, Button.web.tsx, Button.native.tsx, Button.stories.tsx, Button.test.tsx }
│   │   ├── Chip/
│   │   ├── Card/
│   │   ├── Sheet/
│   │   ├── Input/
│   │   ├── SegmentedControl/
│   │   ├── Avatar/
│   │   ├── Pin/
│   │   ├── BannerOffline/
│   │   ├── TabBar/
│   │   └── BottomSheet/
│   ├── hooks/ useColorScheme.ts
│   └── index.ts
├── .storybook/ { main.ts, preview.ts }
├── chromatic.config.json
└── package.json
```

---

## Task 0.5.1 — Design Tokens

**Files:**
- Create: `packages/ui/src/tokens/{colors,typography,spacing,radius,motion,index}.ts`

- [ ] **Step 1: Write failing token test**

```ts
// packages/ui/src/tokens/__tests__/colors.test.ts
import { colors } from '../colors';
test('primary is deep harbour blue', () => expect(colors.primary).toBe('#0E5C8A'));
test('pin palette has 5 categories', () => expect(Object.keys(colors.pin)).toHaveLength(5));
```

- [ ] **Step 2: Run — FAIL**

```bash
pnpm --filter @bitemap/ui test
```

- [ ] **Step 3: Write `colors.ts`**

```ts
export const colors = {
  primary: '#0E5C8A',
  secondary: '#2BB7A8',
  tertiary: '#F59E0B',
  surfaceLight: '#F5FAFB',
  surfaceDark: '#061822',
  success: '#2E9E6A',
  warning: '#D97706',
  danger: '#DC2626',
  textOnLight: '#0B1220',
  textOnDark: '#E7EEF2',
  pin: {
    saltwater: '#2B5D9B',
    freshwater: '#2BB7A8',
    estuarine: '#7A5FD1',
    pelagic: '#E4572E',
    other: '#6B7280',
  },
} as const;
```

- [ ] **Step 4: Tests pass.**

- [ ] **Step 5: Add `typography.ts`, `spacing.ts`, `radius.ts`, `motion.ts`** — mirror spec in `bitemap-ux-research.md` §3.

```ts
// typography.ts
export const typography = {
  display: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 32, lineHeight: 40 },
  headline: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 24, lineHeight: 32 },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 18, lineHeight: 24 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 14, textTransform: 'uppercase' as const },
};

// spacing.ts
export const spacing = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 };

// radius.ts
export const radius = { chip: 8, card: 12, pill: 9999 };

// motion.ts
export const motion = {
  pinDrop: { duration: 200, spring: { stiffness: 240, damping: 22 } },
  sheetOpen: { duration: 250, easing: 'ease-out' },
  offlinePulse: { duration: 1500 / 1.5, easing: 'ease-in-out' },
};
```

- [ ] **Step 6: `tokens/index.ts` barrel + commit**

---

## Task 0.5.2 — Tailwind Preset

**Files:**
- Create: `packages/ui/src/tailwind-preset.ts`

- [ ] **Step 1: Write preset**

```ts
import type { Config } from 'tailwindcss';
import { colors, spacing, radius } from './tokens';

export const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        tertiary: colors.tertiary,
        surface: colors.surfaceLight,
        'surface-dark': colors.surfaceDark,
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
        pin: colors.pin,
      },
      spacing: Object.fromEntries(Object.entries(spacing).map(([k, v]) => [k, `${v}px`])) as Record<string, string>,
      borderRadius: { chip: `${radius.chip}px`, card: `${radius.card}px`, pill: '9999px' },
      fontFamily: { headline: ['PlusJakartaSans'], body: ['Inter'] },
    },
  },
};

export default preset;
```

- [ ] **Step 2: Consume in web**

In `apps/web/tailwind.config.ts`:

```ts
import preset from '@bitemap/ui/tailwind-preset';
export default { presets: [preset], content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'] };
```

- [ ] **Step 3: Consume in mobile (NativeWind)**

In `apps/mobile/tailwind.config.js`:

```js
const preset = require('@bitemap/ui/tailwind-preset').default;
module.exports = { presets: [preset], content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'] };
```

- [ ] **Step 4: Commit**

---

## Task 0.5.3 — Primitive: `Button`

**Files:**
- Create: `packages/ui/src/components/Button/{index.ts, types.ts, Button.web.tsx, Button.native.tsx, Button.test.tsx, Button.stories.tsx}`

- [ ] **Step 1: `types.ts`**

```ts
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  accessibilityLabel?: string;
}
```

- [ ] **Step 2: Write failing web test**

```tsx
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './Button.web';
test('renders label and fires onPress', () => {
  const fn = jest.fn();
  render(<Button onPress={fn}>Post Catch</Button>);
  screen.getByText('Post Catch').click();
  expect(fn).toHaveBeenCalled();
});
test('disabled does not fire', () => {
  const fn = jest.fn();
  render(<Button disabled onPress={fn}>x</Button>);
  screen.getByText('x').click();
  expect(fn).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: FAIL**

- [ ] **Step 4: Implement `Button.web.tsx`**

```tsx
import type { ButtonProps } from './types';

const variantClass = {
  primary: 'bg-secondary text-white',
  secondary: 'bg-primary text-white',
  ghost: 'bg-transparent text-primary border border-primary',
  danger: 'bg-danger text-white',
} as const;

const sizeClass = { sm: 'h-9 px-3 text-sm', md: 'h-11 px-4 text-base', lg: 'h-14 px-6 text-lg' } as const;

export function Button({ variant = 'primary', size = 'md', disabled, loading, onPress, children, accessibilityLabel }: ButtonProps) {
  return (
    <button
      aria-label={accessibilityLabel}
      disabled={disabled || loading}
      onClick={() => !disabled && !loading && onPress()}
      className={`rounded-pill font-semibold ${variantClass[variant]} ${sizeClass[size]} ${disabled ? 'opacity-50' : ''}`}
    >
      {loading ? '…' : children}
    </button>
  );
}
```

- [ ] **Step 5: PASS**

- [ ] **Step 6: Write native test via `@testing-library/react-native`** — same shape using `fireEvent.press`.

- [ ] **Step 7: Implement `Button.native.tsx`**

```tsx
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { colors, radius, spacing } from '../../tokens';
import type { ButtonProps } from './types';

const bgFor = (v: NonNullable<ButtonProps['variant']>) => ({
  primary: colors.secondary, secondary: colors.primary, ghost: 'transparent', danger: colors.danger,
}[v]);

export function Button({ variant = 'primary', size = 'md', disabled, loading, onPress, children, accessibilityLabel }: ButtonProps) {
  const height = size === 'sm' ? 36 : size === 'lg' ? 56 : 44;
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={() => !disabled && !loading && onPress()}
      style={{
        height, paddingHorizontal: spacing[4], borderRadius: radius.pill,
        backgroundColor: bgFor(variant), justifyContent: 'center', alignItems: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: variant === 'ghost' ? colors.primary : '#fff', fontWeight: '600' }}>{children}</Text>}
    </Pressable>
  );
}
```

- [ ] **Step 8: `index.ts` platform switch**

```ts
export * from './Button.web'; // Metro resolves `.native.tsx` automatically for RN
```

Actually use Metro's platform extension auto-resolution — the import resolver handles it. Keep `index.web.ts` → `export * from './Button.web'` and `index.native.ts` → `export * from './Button.native'`.

- [ ] **Step 9: Storybook story**

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button.web';
const meta: Meta<typeof Button> = { component: Button };
export default meta;
export const Primary: StoryObj<typeof Button> = { args: { children: 'Post Catch', onPress: () => {} } };
export const Ghost: StoryObj<typeof Button> = { args: { ...Primary.args, variant: 'ghost' } };
export const Disabled: StoryObj<typeof Button> = { args: { ...Primary.args, disabled: true } };
export const Loading: StoryObj<typeof Button> = { args: { ...Primary.args, loading: true } };
```

- [ ] **Step 10: Commit**

---

## Task 0.5.4 — Primitives in Sequence (same TDD shape)

Each repeats the structure of 0.5.3 — one test file, one `.web.tsx`, one `.native.tsx`, one story.

- [ ] `Chip` — `{ label, active?, onPress?, color? (pin palette) }`
- [ ] `Card` — `{ children, elevation?: 'none' | 'subtle' }`
- [ ] `Sheet` — modal with backdrop, native = react-native-reanimated, web = framer-motion
- [ ] `Input` — text input with label, error, helper
- [ ] `SegmentedControl` — `{ options: {value,label}[], value, onChange }`
- [ ] `Avatar` — round image, size sm/md/lg, fallback initials
- [ ] `Pin` — SVG fish silhouette + category colour fill + alpha prop (recency)
- [ ] `BannerOffline` — full-width warning pill with pulse animation
- [ ] `TabBar` — 5-item bottom tab with raised centre FAB for "Report"
- [ ] `BottomSheet` — snap points, drag to dismiss (native only; web = Sheet)

Each gets: test → fail → implement web → pass → implement native → manual smoke → story → commit.

---

## Task 0.5.5 — Storybook Setup

- [ ] Install `@storybook/nextjs` into `packages/ui/.storybook`
- [ ] `main.ts` — point stories at `src/components/**/*.stories.tsx`
- [ ] `preview.ts` — load tokens, wrap all stories with BackgroundDecorator (light + dark backgrounds toggle)
- [ ] `pnpm --filter @bitemap/ui storybook` → runs on :6006
- [ ] Commit

---

## Task 0.5.6 — Accessibility (jest-axe)

- [ ] Install `jest-axe`
- [ ] Add `axe` matcher to Jest setup
- [ ] For every component add a test: `expect(await axe(container)).toHaveNoViolations()`
- [ ] Run `pnpm --filter @bitemap/ui test` → all stories zero violations
- [ ] Commit

---

## Task 0.5.7 — Chromatic Visual Regression

- [ ] `pnpm dlx chromatic --project-token=$CHROMATIC_TOKEN` — publishes initial baseline
- [ ] Add to CI (branch-protected): any visual diff requires human review
- [ ] Commit `chromatic.config.json`

---

## Task 0.5.8 — Consume in Apps (smoke)

- [ ] `apps/web/src/app/page.tsx` — render one of each primitive

```tsx
import { Button, Chip, Card, Pin } from '@bitemap/ui';
export default function Home() {
  return (
    <main className="p-8 space-y-4 bg-surface min-h-screen">
      <Button onPress={() => alert('posted')}>Post Catch</Button>
      <Chip label="Snapper" active />
      <Card><p>Sample card</p></Card>
      <Pin category="saltwater" alpha={1} />
    </main>
  );
}
```

- [ ] `apps/mobile/App.tsx` — same primitives.

- [ ] Manual smoke: both render, look correct in light + dark.

- [ ] Commit

---

## Phase 0.5 Acceptance

- [ ] Every primitive has unit test, native test, story, axe test
- [ ] `pnpm turbo test` all green
- [ ] Storybook builds without warnings
- [ ] Chromatic baseline published
- [ ] Apps render all primitives correctly on iOS + Android + web
- [ ] Visual diff against Stitch screens is within reasonable tolerance — if not, iterate tokens

**If all pass → proceed to Phase 1.**
