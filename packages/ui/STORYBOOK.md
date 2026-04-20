# Storybook & Chromatic — Deferred Setup

Storybook and Chromatic are scaffolded (configs committed) but not yet installed or wired because:

- Storybook's `@storybook/nextjs` preset is ~300 MB of peer dependencies and requires a compatible Next.js install within the package. Adding it in Phase 0.5 bloats install time; it is a design-QA tool, not a runtime requirement.
- Chromatic needs a `$CHROMATIC_TOKEN` from the chromatic.com project. The project has not been created yet — that happens during Phase 11 (launch prep).

## To enable Storybook

```bash
pnpm --filter @bitemap/ui add -D \
  @storybook/nextjs@^8.3.0 \
  @storybook/react@^8.3.0 \
  @storybook/addon-essentials@^8.3.0 \
  @storybook/addon-a11y@^8.3.0 \
  storybook@^8.3.0
```

Add scripts to `packages/ui/package.json`:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build -o storybook-static"
  }
}
```

Write one story per primitive following the pattern in `src/components/Button/Button.stories.tsx`.

Run: `pnpm --filter @bitemap/ui storybook` → open http://localhost:6006.

## To enable Chromatic

1. Create a project at chromatic.com linked to the git remote (added in Phase 11).
2. Set `CHROMATIC_TOKEN` as a repo secret in GitHub Actions.
3. Replace `"projectId": "TBD"` in `chromatic.config.json` with the real id.
4. Add a CI step that runs `pnpm dlx chromatic --project-token=$CHROMATIC_TOKEN` after the Storybook build.
