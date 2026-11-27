# Local dependency recovery

Date: 30 August 2026

## Observed cause

Angular startup repeatedly waited on filesystem reads before compilation. `ls -lO` showed `hidden,compressed,dataless` on an existing RxJS dependency and `compressed,dataless` on the lockfile. The files existed as placeholders but their contents were not resident on disk. This is an environment problem, not evidence of a passing or failing application test.

## Recovery performed

- Preserved the old dependency folder at `.cache/makh-restore/20260830/node_modules`; nothing was deleted. Retaining the `node_modules` basename keeps the backup outside source-only scans.
- Restored all 505 packages with the existing frozen lockfile, without upgrading versions.
- Used `/Users/tmkaliyu/.cache/makh-trading/virtual-store` for installed packages and `/Users/tmkaliyu/.cache/makh-trading/store` for downloaded packages, outside Documents. The project retains normal pnpm dependency links.
- Consolidated the native-build allowlist in `pnpm-workspace.yaml`: `@parcel/watcher`, `esbuild`, `lmdb`, and `msgpackr-extract`. Removed the duplicate package-level setting and the conflicting empty workspace allowlist.
- All approved native installation steps completed. A sampled restored RxJS file no longer had the `dataless` flag.
- The public Angular suite subsequently passed 26 tests; the production build prerendered all nine routes. Remaining project-file reads can still require on-demand hydration.

## Local restore command

Use the project-pinned Node and pnpm versions. On this workstation, subsequent restores should preserve the selected local paths:

```sh
pnpm install --frozen-lockfile \
  --virtual-store-dir /Users/tmkaliyu/.cache/makh-trading/virtual-store \
  --store-dir /Users/tmkaliyu/.cache/makh-trading/store \
  --package-import-method copy
```

These absolute paths are workstation-specific and are not committed as global pnpm settings. CI continues to use its existing locked restore. For another workstation, select an equivalent local, non-cloud-managed cache. Do not delete source files or disable system-wide cloud synchronization as a recovery shortcut.

Run performance audits after builds/tests finish and preserve failed as well as passing evidence; first-read hydration and concurrent compilation can contaminate local lab results. No production or live-trading approval follows from restoring this toolchain.
