## What changed

<!-- One paragraph. Link the issue if there is one. -->

## Why

<!-- The decision or bug this fixes. -->

## Verification

- [ ] `node scripts/validate.js`
- [ ] `node --test "tests/**/*.test.js"`
- [ ] `node bench/run.js` (before/after metrics below if ranking changed)
- [ ] New/updated test for the change

```text
before:
after:
```

## Data changes

- [ ] Every new price has a first-party source URL and a read date.
- [ ] Estimated prices are marked `confidence: "estimated"`.

## Checklist

- [ ] No runtime dependencies added.
- [ ] `--json` output remains backward compatible.
- [ ] README/docs updated if user-facing.
- [ ] I have read `CONTRIBUTING.md`.
