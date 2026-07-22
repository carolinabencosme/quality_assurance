# Contributing

## Branches

- Create focused branches from the current integration branch: `feature/*`, `fix/*`, `docs/*`, or `cierre/*`.
- Keep `main`, `develop`, and release/closeout branches protected.
- Rebase or merge the target branch before requesting final review; do not rewrite shared history.

## Commits

Use Conventional Commits with an imperative, scoped message when useful:

```text
feat(security): validate imported Keycloak scopes
test(e2e): add accessibility smoke
docs(qa): archive live closeout evidence
```

Allowed common types are `feat`, `fix`, `test`, `docs`, `ci`, `refactor`, `perf`, `build`, and `chore`.

## Pull request checklist

- [ ] The change has one clear purpose and no real secret is committed.
- [ ] Backend changes pass `cd backend && ./mvnw verify`.
- [ ] Frontend changes pass `npm run lint` and `npm run build`.
- [ ] API/UI behavior changes include Newman, Playwright, or focused automated coverage.
- [ ] Security/observability behavior has negative-path evidence where applicable.
- [ ] Documentation and `.env*.example` files reflect configuration changes.
- [ ] Generated reports are summaries; large raw artifacts remain in CI.
- [ ] The PR uses a Conventional Commit title and links its issue or rubric item.

## Review and merge

At least one reviewer should confirm authorization boundaries, migrations, public API compatibility, and evidence. Prefer squash merge with the PR title as the final Conventional Commit. The recommended repository rules are listed in [`docs/branch-protection.md`](docs/branch-protection.md).
