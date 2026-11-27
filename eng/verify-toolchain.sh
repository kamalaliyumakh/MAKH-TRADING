#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
required_node="$(tr -d '[:space:]' < "$repository_root/.node-version")"
required_dotnet="$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' "$repository_root/global.json")"

actual_node="$(node --version | sed 's/^v//')"
actual_dotnet="$(dotnet --version)"

if [[ "$actual_node" != "$required_node" ]]; then
  echo "Node $required_node is required; found $actual_node." >&2
  exit 1
fi

if [[ "$actual_dotnet" != "$required_dotnet" ]]; then
  echo ".NET SDK $required_dotnet is required; found $actual_dotnet." >&2
  exit 1
fi

echo "Toolchain verified: Node $actual_node, .NET SDK $actual_dotnet."
