#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE_DIR="$HOME/.pipali/runtimes/node-v24.21.0-darwin-arm64/bin"
PNPM_DIR="$HOME/.pipali/runtimes/pnpm-10.34.6/node_modules/.bin"
if [ -x "$NODE_DIR/node" ]; then export PATH="$NODE_DIR:$PATH"; fi
if [ -x "$PNPM_DIR/pnpm" ]; then export PATH="$PNPM_DIR:$PATH"; fi
if ! command -v node >/dev/null 2>&1 || ! command -v pnpm >/dev/null 2>&1; then
  printf '\nНужны Node.js 24 LTS и pnpm 10.34.6. См. README.md.\n'
  exit 1
fi
if [ "$(node -p 'process.versions.node.split(".")[0]')" != "24" ]; then
  printf '\nДля проекта нужен Node.js 24 LTS. Текущая версия: '
  node --version
  exit 1
fi
export NEXT_TELEMETRY_DISABLED=1
if [ -d "$HOME/.pipali/browsers" ]; then export PLAYWRIGHT_BROWSERS_PATH="$HOME/.pipali/browsers"; fi
cd "$ROOT"
exec pnpm "${@:-dev}"
