# CI templates

The workflows in this folder are the real CI configuration, kept here because the
GitHub CLI token used to publish the repository has `repo` scope but not
`workflow` scope. GitHub rejects a push that creates `.github/workflows/*` with
that token.

To enable CI in one command:

```bash
mkdir -p .github/workflows
cp docs/ci/ci.yml docs/ci/pages.yml docs/ci/release.yml .github/workflows/
git add .github/workflows
git commit -m "ci: enable GitHub Actions"
git push
```

If the push is rejected with:

```
refusing to allow an OAuth App to create or update workflow
```

refresh the token with the workflow scope:

```bash
gh auth refresh -h github.com -s workflow
```

Then push again. No code changes are required.

## What the workflows do

| File | Trigger | Jobs |
|---|---|---|
| `ci.yml` | push to main, PR, manual | validate → test → benchmark on Ubuntu/Windows/macOS × Node 20/22/24; uploads `tests/results` |
| `pages.yml` | push to `site/` or manual | deploys `site/` to GitHub Pages |
| `release.yml` | tag `v*` | validates, tests, creates a GitHub release from the tag |

The local equivalents are:

```bash
node scripts/validate.js
node --test "tests/**/*.test.js"
node bench/run.js
node bench/holdout.js
node tests/adversarial/run.js
node scripts/check.js
```

CI is a convenience, not the source of truth. The evidence in `tests/results/`
was produced locally on Windows with Node 24 and is committed.
