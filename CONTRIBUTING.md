# Contributing

## Workflow

1. Create an issue describing the change, or pick an existing one.
2. Branch from `main`: `feat/short-name`, `fix/short-name`, `docs/short-name`, `chore/short-name`.
3. Keep changes small and focused. One concern per pull request.
4. Run `npm run lint`, `npm run typecheck` and `npm test` before pushing.
5. Open a pull request using the template. Link the issue.
6. Squash-merge once checks pass and the review is done.

## Commit messages

Conventional Commits, in the imperative mood, subject under 72 characters:

```
feat(home): add search input with length validation
fix(csp): allow font files from same origin
docs: describe tool data model
chore(deps): bump next to latest patch
```

Types used: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`.

## Code style

- TypeScript with `strict` on. No `any` without a comment explaining why.
- Prettier formats, ESLint checks. Do not argue with the formatter.
- Name things for what they are. Prefer clear names over comments; comment the reason, not the action.
- No dead code, no commented-out code, no unused dependencies.
- Components are small and have one job. Shared logic goes in `src/lib`.
- Accessibility is part of done: keyboard works, focus is visible, contrast passes, motion respects `prefers-reduced-motion`.

## Tests

New logic gets a test. Bug fixes get a test that fails before the fix.

## Dependencies

Add a dependency only when writing it ourselves would be worse. Check its maintenance, size and licence, and mention it in the pull request.
