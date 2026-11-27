#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repository_root"

# Prefer the repository-pinned runtimes when they are installed. This keeps the
# one-command verification reproducible without changing the developer's global
# Node or .NET installations.
if [[ -n "${DOTNET_ROOT:-}" && -x "$DOTNET_ROOT/dotnet" ]]; then
  export PATH="$DOTNET_ROOT:$PATH"
elif [[ -x "$repository_root/.tools/dotnet/dotnet" ]]; then
  export PATH="$repository_root/.tools/dotnet:$PATH"
fi

if [[ -x "$repository_root/.tmp/node-runtime/bin/node" ]]; then
  export PATH="$repository_root/.tmp/node-runtime/bin:$PATH"
fi

./eng/verify-toolchain.sh
pnpm check:devsecops
pnpm verify:environments
dotnet restore MAKH.Trading.slnx --locked-mode
dotnet build MAKH.Trading.slnx --no-restore --configuration Release
dotnet test MAKH.Trading.slnx --no-build --configuration Release
./eng/verify-postgres-foundation.sh
pnpm verify:foundation-gate
pnpm_install_args=(--frozen-lockfile)
if [[ -n "${MAKH_PNPM_STORE_DIR:-}" ]]; then
  pnpm_install_args+=(--store-dir "$MAKH_PNPM_STORE_DIR")
fi
if [[ -n "${MAKH_PNPM_VIRTUAL_STORE_DIR:-}" ]]; then
  pnpm_install_args+=(--virtual-store-dir "$MAKH_PNPM_VIRTUAL_STORE_DIR")
fi
pnpm install "${pnpm_install_args[@]}"
pnpm verify

echo "WBS 3.1 repository foundation verification passed."
