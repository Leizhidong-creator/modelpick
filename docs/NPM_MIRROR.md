# NPM mirror

The official npm package is live: `npm install modelpick`. The repository also serves a **read-only static npm registry** from GitHub Pages as a fallback.

```bash
npm install modelpick --registry=https://leizhidong-creator.github.io/modelpick/npm/
```

Then:

```bash
npx modelpick verify
npx modelpick pick "3D sword for Unity"
```

This is a fallback, not the primary install. It is a registry-scoped install from a static file plus the GitHub Release tarball.

## Why

- No npm auth is needed.
- The package metadata and tarball are version-pinned.
- The tarball SHA-512 is embedded in the registry document.
- It works from a clean project; verified locally with `npm install modelpick --registry=http://127.0.0.1:8765/`.

## Limits

- This is a static mirror; if you installed an earlier revision of the same version, clear the npm cache once: `npm cache clean --force`. New installs are unaffected.

- You must pass `--registry`; it does not change the user's global registry.
- Only `modelpick` is served.
- The public npm registry is the primary path; this mirror is fallback only.
- The static metadata must be regenerated when the version changes.

## Regenerate

The registry document lives at [`docs/npm/modelpick`](npm/modelpick). It contains:

- `dist-tags.latest`
- the version's `bin`, `engines`, and `dist`
- `dist.tarball` pointing at the GitHub Release asset
- `dist.integrity` as `sha512-...`

Rebuild it from the packed tarball and update the release asset before changing the version.

## Verification

```bash
node -e "const j=JSON.parse(require('fs').readFileSync('docs/npm/modelpick','utf8')); console.log(j['dist-tags'].latest, j.versions['0.1.3'].dist.integrity)"
```
