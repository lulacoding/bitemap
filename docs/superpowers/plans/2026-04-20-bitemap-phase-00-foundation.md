# BiteMap Phase 0 — Monorepo Foundation (Detailed TDD Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Stand up a Turborepo monorepo with Expo (mobile), Next.js 14 (web), shared packages, full linting/typechecking/CI — green on `main`.

**Architecture:** pnpm workspaces + Turborepo. Single TypeScript config base. ESLint flat config. GitHub Actions CI. Two apps (`apps/mobile`, `apps/web`), two packages (`packages/shared`, `packages/ui`), plus `supabase/` scaffold (empty until Phase 1).

**Tech Stack:** pnpm ≥ 9, Turborepo ≥ 2, TypeScript ≥ 5.4, Expo SDK 52, Next.js 14 App Router, React 18, ESLint 9 flat, Prettier 3.

---

## File Structure

**Create:**
- `/package.json` (root, pnpm workspaces, turbo devDep)
- `/pnpm-workspace.yaml`
- `/turbo.json` (pipeline: build, lint, typecheck, test, dev)
- `/tsconfig.base.json`
- `/eslint.config.mjs` (flat config, root)
- `/.prettierrc`
- `/.editorconfig`
- `/.gitignore`
- `/.env.example`
- `/README.md`
- `/.github/workflows/ci.yml`
- `/apps/mobile/` (Expo blank TS template)
- `/apps/web/` (Next.js 14 App Router TS template)
- `/packages/shared/src/index.ts` + `package.json` + `tsconfig.json`
- `/packages/ui/src/index.ts` + `package.json` + `tsconfig.json`
- `/supabase/.gitkeep`

---

## Task 0.1 — Initialize Root Workspace

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.editorconfig`, `.prettierrc`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "bitemap",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "turbo": "^2.1.3",
    "typescript": "^5.4.5",
    "prettier": "^3.2.5",
    "eslint": "^9.9.0",
    "@types/node": "^20.14.0"
  },
  "engines": { "node": ">=20" }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - apps/*
  - packages/*
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules
.turbo
dist
.next
.expo
.env
.env.local
.env.*.local
*.log
coverage
.vscode/*
!.vscode/settings.json
.DS_Store
```

- [ ] **Step 4: Create `.editorconfig`**

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

- [ ] **Step 5: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 6: Run `pnpm install`**

Expected: no errors; `node_modules` created.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: initialize pnpm + turbo workspace"
```

---

## Task 0.2 — Root TypeScript + ESLint Base Config

**Files:**
- Create: `tsconfig.base.json`, `eslint.config.mjs`

- [ ] **Step 1: `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 2: `eslint.config.mjs`**

```js
import tseslint from 'typescript-eslint';
import js from '@eslint/js';

export default tseslint.config(
  { ignores: ['**/node_modules', '**/dist', '**/.next', '**/.expo', '**/build'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
);
```

- [ ] **Step 3: Add devDeps**

```bash
pnpm add -Dw typescript-eslint @eslint/js
```

- [ ] **Step 4: Verify ESLint runs**

```bash
pnpm eslint .
```

Expected: runs without crashing (may report 0 errors on empty workspace).

- [ ] **Step 5: Commit**

```bash
git add . && git commit -m "chore: add root tsconfig + eslint flat config"
```

---

## Task 0.3 — `packages/shared` Skeleton

**Files:**
- Create: `packages/shared/package.json`, `tsconfig.json`, `src/index.ts`, `src/__tests__/sanity.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// packages/shared/src/__tests__/sanity.test.ts
import { APP_NAME } from '../index';
test('shared exports APP_NAME', () => { expect(APP_NAME).toBe('BiteMap'); });
```

- [ ] **Step 2: Run test — fails**

```bash
pnpm --filter @bitemap/shared test
```

Expected: FAIL (APP_NAME not defined).

- [ ] **Step 3: Create package.json**

```json
{
  "name": "@bitemap/shared",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint src",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "devDependencies": { "vitest": "^2.0.0" }
}
```

- [ ] **Step 4: Create tsconfig**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src"]
}
```

- [ ] **Step 5: Create `src/index.ts`**

```ts
export const APP_NAME = 'BiteMap' as const;
```

- [ ] **Step 6: Test passes**

```bash
pnpm --filter @bitemap/shared test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add . && git commit -m "feat(shared): add APP_NAME export + vitest"
```

---

## Task 0.4 — `packages/ui` Skeleton

**Files:**
- Create: `packages/ui/package.json`, `tsconfig.json`, `src/index.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@bitemap/ui",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint src",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": { "react": "^18.3.0" }
}
```

- [ ] **Step 2: Create tsconfig + placeholder**

```ts
// packages/ui/src/index.ts
export const UI_PACKAGE = '@bitemap/ui' as const;
```

- [ ] **Step 3: Typecheck**

```bash
pnpm --filter @bitemap/ui typecheck
```

Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add . && git commit -m "feat(ui): add ui package skeleton"
```

---

## Task 0.5 — `apps/web` (Next.js 14)

**Files:**
- Create via `create-next-app` then modify: `apps/web/*`

- [ ] **Step 1: Scaffold**

```bash
pnpm dlx create-next-app@latest apps/web \
  --ts --app --eslint --tailwind --src-dir --import-alias "@/*" --no-turbopack
```

- [ ] **Step 2: Modify `apps/web/package.json`** — add workspace deps

```json
{
  "dependencies": {
    "@bitemap/shared": "workspace:*",
    "@bitemap/ui": "workspace:*",
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  }
}
```

- [ ] **Step 3: Replace home page** — `apps/web/src/app/page.tsx`

```tsx
import { APP_NAME } from '@bitemap/shared';
export default function Home() {
  return <main className="p-8 text-2xl">Hello {APP_NAME}</main>;
}
```

- [ ] **Step 4: `pnpm install`** (hoists workspace deps)

- [ ] **Step 5: Verify dev server**

```bash
pnpm --filter web dev
```

Expected: http://localhost:3000 renders "Hello BiteMap".

- [ ] **Step 6: Commit**

```bash
git add . && git commit -m "feat(web): scaffold next 14 + consume shared"
```

---

## Task 0.6 — `apps/mobile` (Expo)

**Files:**
- Create via `create-expo-app`: `apps/mobile/*`

- [ ] **Step 1: Scaffold**

```bash
pnpm dlx create-expo-app apps/mobile --template blank-typescript
```

- [ ] **Step 2: Edit `apps/mobile/package.json`** — add workspace deps

```json
{
  "dependencies": {
    "@bitemap/shared": "workspace:*",
    "@bitemap/ui": "workspace:*"
  }
}
```

- [ ] **Step 3: Configure Metro for workspace** — `apps/mobile/metro.config.js`

```js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, '../..')];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../../node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
module.exports = config;
```

- [ ] **Step 4: Replace `App.tsx`**

```tsx
import { APP_NAME } from '@bitemap/shared';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.h}>Hello {APP_NAME}</Text>
      <StatusBar style="auto" />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  h: { fontSize: 24, fontWeight: '600' },
});
```

- [ ] **Step 5: `pnpm install && pnpm --filter mobile start`**

Expected: QR code → scan with Expo Go → "Hello BiteMap" renders.

- [ ] **Step 6: Commit**

```bash
git add . && git commit -m "feat(mobile): scaffold expo + consume shared"
```

---

## Task 0.7 — `turbo.json` Pipeline

- [ ] **Step 1: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "lint": {},
    "typecheck": {},
    "test": {},
    "dev": { "cache": false, "persistent": true }
  }
}
```

- [ ] **Step 2: Run full pipeline**

```bash
pnpm turbo lint typecheck test build
```

Expected: all tasks green.

- [ ] **Step 3: Commit**

---

## Task 0.8 — GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write workflow**

```yaml
name: CI
on:
  pull_request:
  push: { branches: [main] }
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint typecheck test build
```

- [ ] **Step 2: Commit + push**

```bash
git add . && git commit -m "chore(ci): add lint/typecheck/test/build pipeline"
git push
```

- [ ] **Step 3: Verify green**

Open PR on a dummy branch — CI must pass.

---

## Task 0.9 — README + `.env.example`

**Files:**
- Create: `README.md`, `.env.example`

- [ ] **Step 1: `.env.example`**

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=
EXPO_PUBLIC_MAPBOX_TOKEN=
```

- [ ] **Step 2: README** — sections: Setup, Dev commands (web, mobile), Test, Lint, Structure diagram.

- [ ] **Step 3: Commit**

---

## Phase 0 Acceptance (run in order)

- [ ] `pnpm install` clean (no unmet peer warnings beyond RN quirks)
- [ ] `pnpm turbo lint typecheck test build` — all green
- [ ] `pnpm --filter web dev` → http://localhost:3000 shows "Hello BiteMap"
- [ ] `pnpm --filter mobile start` → Expo Go shows "Hello BiteMap"
- [ ] CI green on dummy PR
- [ ] `git tag v0.0.0-foundation`

**If all checks pass → proceed to Phase 0.5.**
